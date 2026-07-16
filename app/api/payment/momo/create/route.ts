import { NextResponse } from "next/server";
import { createPaymentTransaction, momoSignature } from "@/lib/payment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, orderCode, amount } = body;

    if (!orderId || !orderCode || !amount) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE || "";
    const accessKey = process.env.MOMO_ACCESS_KEY || "";
    const secretKey = process.env.MOMO_SECRET_KEY || "";
    const momoUrl = process.env.MOMO_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
    const returnUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/thanh-toan/${orderId}`;
    const notifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/momo/ipn`;

    if (!partnerCode || !accessKey || !secretKey) {
      return NextResponse.json({ error: "Chưa cấu hình MoMo" }, { status: 500 });
    }

    const requestId = orderCode + "_" + Date.now();
    const orderInfo = `Thanh toan don hang ${orderCode}`;
    const extraData = "";
    const requestType = "captureWallet";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderCode}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = momoSignature(rawSignature, secretKey);

    const momoBody = {
      partnerCode,
      partnerName: "Salon Hair System",
      storeId: "SALON_HAIR",
      requestId,
      amount,
      orderId: orderCode,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      lang: "vi",
      extraData,
      requestType,
      signature,
    };

    const momoRes = await fetch(momoUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(momoBody),
    });

    const momoData = await momoRes.json();

    await createPaymentTransaction({
      orderId,
      method: "MOMO",
      amount,
      transactionNo: momoData?.transId || null,
      payload: momoData,
    });

    return NextResponse.json({
      payUrl: momoData?.payUrl || "",
      deeplink: momoData?.deeplink || "",
      qrCodeUrl: momoData?.qrCodeUrl || "",
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tạo thanh toán MoMo" }, { status: 500 });
  }
}