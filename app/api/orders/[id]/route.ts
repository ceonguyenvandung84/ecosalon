import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { buildVietQrUrl } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }

    // Load bank settings
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["bank_code", "bank_account_number", "bank_account_name", "bank_name"] } },
    });
    const sMap: Record<string, string> = {};
    settings.forEach((s) => (sMap[s.key] = s.value));

    const qrUrl =
      order.status === "PENDING_PAYMENT"
        ? buildVietQrUrl({
            bankCode: sMap.bank_code ?? "",
            accountNumber: sMap.bank_account_number ?? "",
            accountName: sMap.bank_account_name ?? "",
            amount: order.total,
            addInfo: order.orderCode,
          })
        : "";

    return NextResponse.json({
      order: {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        note: order.note,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        items: order.items.map((it) => ({
          id: it.id,
          productTitle: it.productTitle,
          productImage: resolveImageUrl(it.productImage),
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          lineTotal: it.lineTotal,
        })),
      },
      bank: {
        bankName: sMap.bank_name ?? "",
        bankCode: sMap.bank_code ?? "",
        accountNumber: sMap.bank_account_number ?? "",
        accountName: sMap.bank_account_name ?? "",
      },
      qrUrl,
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

// User can cancel their own pending order
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const action = (body?.action ?? "").toString();
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }
    if (action === "cancel") {
      if (order.status !== "PENDING_PAYMENT") {
        return NextResponse.json({ error: "Chỉ có thể hủy đơn hàng chưa thanh toán." }, { status: 400 });
      }
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
