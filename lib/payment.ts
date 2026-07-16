import crypto from "crypto";
import { prisma } from "./db";

export function sortObject(obj: Record<string, string | number>): Record<string, string | number> {
  return Object.keys(obj).sort().reduce((acc, key) => {
    acc[key] = obj[key]!;
    return acc;
  }, {} as Record<string, string | number>);
}

export function vnpayHash(query: string, secretKey: string): string {
  return crypto.createHmac("sha512", secretKey).update(query).digest("hex");
}

export function buildVnpayUrl(params: {
  amount: number;
  orderCode: string;
  orderInfo: string;
  returnUrl: string;
  tmnCode: string;
  hashSecret: string;
  vnpayUrl: string;
  ipAddr?: string;
}): string {
  const { amount, orderCode, orderInfo, returnUrl, tmnCode, hashSecret, vnpayUrl, ipAddr } = params;
  const date = new Date();
  const createDate = date.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const expireDate = new Date(date.getTime() + 15 * 60 * 1000).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

  const clientIp = ipAddr || "127.0.0.1";

  const vnpParams: Record<string, string | number> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderCode,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sorted = sortObject(vnpParams);
  const queryString = new URLSearchParams(
    Object.entries(sorted).map(([k, v]) => [k, String(v)])
  ).toString();
  const secureHash = vnpayHash(queryString, hashSecret);
  return `${vnpayUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
}

export function verifyVnpayReturn(params: Record<string, string>, hashSecret: string): boolean {
  const secureHash = params["vnp_SecureHash"];
  const signParams = { ...params };
  delete signParams["vnp_SecureHash"];
  delete signParams["vnp_SecureHashType"];
  const sorted = sortObject(signParams);
  const queryString = new URLSearchParams(
    Object.entries(sorted).map(([k, v]) => [k, String(v)])
  ).toString();
  const computedHash = vnpayHash(queryString, hashSecret);
  return computedHash === secureHash;
}

export function momoSignature(rawSignature: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");
}

export async function createPaymentTransaction(data: {
  orderId: string;
  method: string;
  amount: number;
  transactionNo?: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.paymentTransaction.create({
    data: {
      orderId: data.orderId,
      method: data.method,
      amount: data.amount,
      transactionNo: data.transactionNo || null,
      payload: JSON.stringify(data.payload ?? null),
    },
  });
}
