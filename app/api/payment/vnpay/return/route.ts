import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyVnpayReturn, createPaymentTransaction } from "@/lib/payment";
import { processPaidOrder } from "@/lib/orders";

export async function GET(req: NextRequest) {
  try {
    const hashSecret = process.env.VNP_HASH_SECRET || "";
    if (!hashSecret) {
      return NextResponse.redirect(new URL("/thanh-toan?error=config", req.url));
    }

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const isValid = verifyVnpayReturn(params, hashSecret);

    if (!isValid) {
      return NextResponse.redirect(new URL("/thanh-toan?error=invalid", req.url));
    }

    const orderCode = params["vnp_TxnRef"];
    const responseCode = params["vnp_ResponseCode"];
    const transactionNo = params["vnp_TransactionNo"];
    const amount = parseInt(params["vnp_Amount"] || "0") / 100;

    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      return NextResponse.redirect(new URL("/thanh-toan?error=notfound", req.url));
    }

    await createPaymentTransaction({
      orderId: order.id,
      method: "VNPAY",
      amount,
      transactionNo,
      payload: params,
    });

    if (responseCode === "00") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date(), paymentMethod: "VNPAY" },
      });
      await processPaidOrder(order.id);
      return NextResponse.redirect(new URL(`/thanh-toan/${order.id}?success=vnpay`, req.url));
    }

    return NextResponse.redirect(new URL(`/thanh-toan/${order.id}?error=payment`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/thanh-toan?error=server", req.url));
  }
}
