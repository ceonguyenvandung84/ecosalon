import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { courses: true, products: true } } },
    });
    if (!category) {
      return NextResponse.json({ error: "Không tìm thấy danh mục." }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.name) {
      return NextResponse.json({ error: "Thiếu tên danh mục." }, { status: 400 });
    }
    const data: Record<string, unknown> = { name: b.name };
    if (b?.icon !== undefined) data.icon = b.icon ?? null;
    if (b?.description !== undefined) data.description = b.description ?? null;
    if (b?.type !== undefined) {
      if (!["COURSE", "PRODUCT"].includes(b.type as string)) {
        return NextResponse.json({ error: "Loại danh mục không hợp lệ." }, { status: 400 });
      }
      data.type = b.type;
    }
    await prisma.category.update({ where: { id: params.id }, data });
    await logActivity({ userId: admin.id, action: "UPDATE", entity: "Category", entityId: params.id, detail: `Cập nhật danh mục ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const usage = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { courses: true, products: true } } },
    });
    if (!usage) {
      return NextResponse.json({ error: "Không tìm thấy danh mục." }, { status: 404 });
    }
    if ((usage._count?.courses ?? 0) > 0 || (usage._count?.products ?? 0) > 0) {
      return NextResponse.json({
        error: "Không thể xóa danh mục đang có khóa học hoặc sản phẩm.",
      }, { status: 400 });
    }
    await prisma.category.delete({ where: { id: params.id } });
    await logActivity({ userId: admin.id, action: "DELETE", entity: "Category", entityId: params.id, detail: `Xóa danh mục ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
