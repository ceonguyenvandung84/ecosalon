import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

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
    if (!b?.title) {
      return NextResponse.json({ error: "Thiếu tiêu đề." }, { status: 400 });
    }
    if (b?.isDefault) {
      await prisma.certificateTemplate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const data: Record<string, unknown> = { title: b.title };
    if (b?.description !== undefined) data.description = b.description ?? null;
    if (b?.svgTemplate !== undefined) data.svgTemplate = b.svgTemplate;
    if (b?.backgroundPath !== undefined) data.backgroundPath = b.backgroundPath ?? null;
    if (b?.fields !== undefined) data.fields = JSON.stringify(b.fields ?? null);
    if (b?.fonts !== undefined) data.fonts = JSON.stringify(b.fonts ?? null);
    if (b?.placeholder !== undefined) data.placeholder = JSON.stringify(b.placeholder ?? null);
    if (b?.isDefault !== undefined) data.isDefault = !!b.isDefault;
    if (b?.isActive !== undefined) data.isActive = !!b.isActive;
    await prisma.certificateTemplate.update({ where: { id: params.id }, data });
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
    await prisma.certificateTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
