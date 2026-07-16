import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        template: true,
      },
    });
    if (!certificate) {
      return NextResponse.json({ error: "Không tìm thấy chứng chỉ." }, { status: 404 });
    }
    return NextResponse.json({ certificate });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (b?.isRevoked !== undefined) data.isRevoked = !!b.isRevoked;
    if (b?.studentName !== undefined) data.studentName = b.studentName;
    await prisma.certificate.update({ where: { id: params.id }, data });
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
    await prisma.certificate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
