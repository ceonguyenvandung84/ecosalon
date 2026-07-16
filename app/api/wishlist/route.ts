import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { include: { category: true, brand: true } } },
    });
    const data = items.map((w) => ({
      id: w.id,
      product: {
        title: w.product?.title ?? "",
        slug: w.product?.slug ?? "",
        image: resolveImageUrl(parseJsonArray(w.product?.images)[0] ?? ""),
        price: w.product?.price ?? 0,
        discountPercent: w.product?.discountPercent ?? 0,
        category: w.product?.category?.name ?? "",
        brand: w.product?.brand?.name ?? "",
      },
      productId: w.productId,
    }));
    return NextResponse.json({ wishlist: data });
  } catch {
    return NextResponse.json({ wishlist: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const productId = (body?.productId ?? "").toString();
    if (!productId) return NextResponse.json({ error: "Thiếu productId." }, { status: 400 });
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, inWishlist: false });
    }
    await prisma.wishlist.create({ data: { userId: user.id, productId } });
    return NextResponse.json({ success: true, inWishlist: true });
  } catch {
    return NextResponse.json({ error: "Thao tác thất bại." }, { status: 500 });
  }
}
