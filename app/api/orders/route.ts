import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { generateOrderCode, productUnitPrice, computeShippingFee } from "@/lib/orders";
import { notifyAdmins } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    const data = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      status: o.status,
      total: o.total,
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
      createdAt: o.createdAt,
      firstItemImage: resolveImageUrl(o.items[0]?.productImage),
    }));
    return NextResponse.json({ orders: data });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const customerName = ((body?.customerName as string | null) ?? "").toString().trim();
    const customerPhone = ((body?.customerPhone as string | null) ?? "").toString().trim();
    const customerEmail = ((body?.customerEmail as string | null) ?? "").toString().trim();
    const shippingAddress = ((body?.shippingAddress as string | null) ?? "").toString().trim();
    const note = ((body?.note as string | null) ?? "").toString().trim();
    const paymentMethod = ((body?.paymentMethod as string | null) ?? "BANK_QR").toString().trim();

    const phoneRegex = /^0[1-9]\d{8,9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)." }, { status: 400 });
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }
    if (shippingAddress.length > 500) {
      return NextResponse.json({ error: "Địa chỉ quá dài (tối đa 500 ký tự)." }, { status: 400 });
    }
    if (!customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ." }, { status: 400 });
    }
    const validPaymentMethods = ["BANK_QR", "VNPAY", "MOMO"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Phương thức thanh toán không hợp lệ." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    });
    const validItems = (cart?.items ?? []).filter((it) => it.product && it.product.isPublished);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "Giỏ hàng trống." }, { status: 400 });
    }

    // Build order items snapshot (stock check happens atomically in transaction below)
    let subtotal = 0;
    const orderItemsData: Array<{
      itemType: "PRODUCT"; productId: string; productTitle: string;
      productImage: string | null; unitPrice: number; quantity: number; lineTotal: number;
    }> = [];
    for (const it of validItems) {
      const p = it.product!;
      const unitPrice = productUnitPrice(p.price, p.discountPercent);
      const qty = Math.max(1, Math.min(p.stock > 0 ? p.stock : it.quantity, it.quantity));
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      orderItemsData.push({ itemType: "PRODUCT" as const, productId: p.id, productTitle: p.title, productImage: parseJsonArray(p.images)[0] ?? null, unitPrice, quantity: qty, lineTotal });
    }
    const shippingFee = computeShippingFee(subtotal);
    const total = subtotal + shippingFee;

    let orderCode = generateOrderCode();
    for (let i = 0; i < 3; i++) {
      const exists = await prisma.order.findUnique({ where: { orderCode } });
      if (!exists) break;
      orderCode = generateOrderCode();
    }

    // Atomic transaction: check and decrement stock for all items, then create order
    try {
      const order = await prisma.$transaction(async (tx) => {
        for (const item of orderItemsData) {
          const updated = await tx.product.update({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
          });
          if (!updated) {
            const prod = await tx.product.findUnique({ where: { id: item.productId }, select: { title: true, stock: true } });
            throw new Error(`Sản phẩm "${prod?.title ?? ""}" chỉ còn ${prod?.stock ?? 0} trong kho.`);
          }
        }
        return tx.order.create({
          data: {
            orderCode,
            userId: user.id,
            orderType: "PRODUCT",
            status: "PENDING_PAYMENT",
            subtotal,
            shippingFee,
            total,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            shippingAddress,
            note: note || null,
            paymentMethod: paymentMethod as "BANK_QR" | "VNPAY" | "MOMO",
            items: { create: orderItemsData },
          },
        });
      });

      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await notifyAdmins({
        type: "ORDER_STATUS",
        title: "Đơn hàng mới",
        message: `Đơn ${order.orderCode} (${formatPrice(total)}) vừa được đặt.`,
        link: `/admin/don-hang/${order.id}`,
      });
      return NextResponse.json({ success: true, orderId: order.id, orderCode: order.orderCode });
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Sản phẩm")) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
  } catch (e) {
    console.error("Create order error:", e);
    return NextResponse.json({ error: "Tạo đơn hàng thất bại." }, { status: 500 });
  }
}
