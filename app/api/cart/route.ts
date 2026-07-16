import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { productUnitPrice } from "@/lib/orders";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
}

async function getOrCreateCart(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return null;
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) return unauth();
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: { product: { include: { brand: true, category: true } } },
        },
      },
    });
    const items = (cart?.items ?? [])
      .filter((it) => it.product)
      .map((it) => {
        const p = it.product!;
        const unitPrice = productUnitPrice(p.price, p.discountPercent);
        return {
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          title: p.title,
          slug: p.slug,
          image: resolveImageUrl(parseJsonArray(p.images)[0] ?? ""),
          brand: p.brand?.name ?? "",
          price: p.price,
          discountPercent: p.discountPercent,
          unitPrice,
          lineTotal: unitPrice * it.quantity,
          stock: p.stock,
        };
      });
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    return NextResponse.json({ items, totalItems, subtotal });
  } catch (e) {
    console.error("cart GET error:", e);
    return NextResponse.json({ items: [], totalItems: 0, subtotal: 0 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user?.id) return unauth();
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const productId = ((body?.productId as string | null) ?? "").toString();
    const quantity = Math.max(1, parseInt((body?.quantity as string) ?? "1", 10) || 1);
    if (!productId) return NextResponse.json({ error: "Thiếu sản phẩm." }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isPublished) return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
    if (product.stock <= 0) return NextResponse.json({ error: "Sản phẩm đã hết hàng." }, { status: 400 });

    const cart = await getOrCreateCart(user.id);
    if (!cart) return unauth();
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const newQty = Math.min(product.stock, (existing?.quantity ?? 0) + quantity);
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: newQty } });
    }
    const totalItems = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { quantity: true },
    });
    return NextResponse.json({ success: true, totalItems: totalItems._sum.quantity ?? 0 });
  } catch (e) {
    console.error("cart POST error:", e);
    return NextResponse.json({ error: "Thêm vào giỏ hàng thất bại." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user?.id) return unauth();
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("cart DELETE error:", e);
    return NextResponse.json({ error: "Xóa giỏ hàng thất bại." }, { status: 500 });
  }
}
