import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPaymentTransaction, momoSignature } from "@/lib/payment";
import { processPaidOrder } from "@/lib/orders";

interface MoMoIpnBody {
  signature?: string;
  partnerCode?: string;
  orderId?: string;
  amount?: string;
  transId?: string;
  message?: string;
  resultCode?: string;
}

function verifyMoMoSignature(body: MoMoIpnBody): boolean {
  const secretKey = process.env.MOMO_SECRET_KEY;
  if (!secretKey) return false;
  const { signature, partnerCode, orderId, amount, transId, message } = body;
  if (!signature) return false;
  const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&message=${message}&orderId=${orderId}&partnerCode=${partnerCode}&transId=${transId}`;
  const expected = momoSignature(rawSignature, secretKey);
  return signature === expected;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId: orderCode, resultCode, transId, amount } = body;

    if (!orderCode) {
      return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
    }

    if (!verifyMoMoSignature(body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await createPaymentTransaction({
      orderId: order.id,
      method: "MOMO",
      amount: amount || 0,
      transactionNo: transId || null,
      payload: body,
    });

    if (resultCode === 0 || resultCode === "0") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date(), paymentMethod: "MOMO" },
      });
      await processPaidOrder(order.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}