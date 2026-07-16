import { NextResponse } from "next/server";
import { buildVnpayUrl, createPaymentTransaction } from "@/lib/payment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const forwarded = (req as Request).headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
    const { orderId, orderCode, amount } = body;

    if (!orderId || !orderCode || !amount) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    const tmnCode = process.env.VNP_TMN_CODE || "";
    const hashSecret = process.env.VNP_HASH_SECRET || "";
    const vnpayUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/vnpay/return`;

    if (!tmnCode || !hashSecret) {
      return NextResponse.json({ error: "Chưa cấu hình VNPay" }, { status: 500 });
    }

    const paymentUrl = buildVnpayUrl({
      amount,
      orderCode,
      orderInfo: `Thanh toan don hang ${orderCode}`,
      returnUrl,
      tmnCode,
      hashSecret,
      vnpayUrl,
      ipAddr: clientIp,
    });

    await createPaymentTransaction({
      orderId,
      method: "VNPAY",
      amount,
      payload: { paymentUrl },
    });

    return NextResponse.json({ paymentUrl });
  } catch {
    return NextResponse.json({ error: "Lỗi tạo thanh toán VNPay" }, { status: 500 });
  }
}
