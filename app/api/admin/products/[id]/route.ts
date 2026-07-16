import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { logActivity } from "@/lib/activity-log";
import { parseJsonArray, parseJson } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, brand: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }
    return NextResponse.json({
      product: {
        ...product,
        images: parseJsonArray(product.images).map((i) => resolveImageUrl(i)),
      },
    });
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
    if (b?.title !== undefined) data.title = b.title;
    if (b?.shortDesc !== undefined) data.shortDesc = b.shortDesc;
    if (b?.description !== undefined) data.description = b.description;
    if (b?.images !== undefined) data.images = JSON.stringify(Array.isArray(b.images) ? b.images.filter(Boolean) : []);
    if (b?.price !== undefined) data.price = parseInt(b.price as string, 10) || 0;
    if (b?.discountPercent !== undefined) data.discountPercent = parseInt(b.discountPercent as string, 10) || 0;
    if (b?.categoryId !== undefined) data.categoryId = b.categoryId;
    if (b?.brandId !== undefined) data.brandId = (b.brandId as string | null) ?? null;
    if (b?.stock !== undefined) data.stock = parseInt(b.stock as string, 10) || 0;
    if (b?.sku !== undefined) data.sku = (b.sku as string | null) ?? null;
    if (b?.specifications !== undefined) data.specifications = JSON.stringify(b.specifications ?? null);
    if (b?.isPublished !== undefined) data.isPublished = !!b.isPublished;
    if (b?.isFeatured !== undefined) data.isFeatured = !!b.isFeatured;
    if (b?.metaTitle !== undefined) data.metaTitle = b.metaTitle || null;
    if (b?.metaDescription !== undefined) data.metaDescription = b.metaDescription || null;
    if (b?.ogImage !== undefined) data.ogImage = b.ogImage || null;
    await prisma.product.update({ where: { id: params.id }, data });
    await logActivity({ userId: admin.id, action: "UPDATE", entity: "Product", entityId: params.id, detail: `Cập nhật sản phẩm ${params.id}` });
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
    await prisma.product.delete({ where: { id: params.id } });
    await logActivity({ userId: admin.id, action: "DELETE", entity: "Product", entityId: params.id, detail: `Xóa sản phẩm ${params.id}` });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại." }, { status: 500 });
  }
}
