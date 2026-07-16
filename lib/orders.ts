import { prisma } from "./db";
import { discountedPrice } from "./utils";
import { computeCommission, getCommissionHoldDays } from "./affiliate";

// Generate a human-friendly unique order code, e.g. SHS-240612-AB12
export function generateOrderCode(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SHS-${y}${m}${d}-${rand}`;
}

// Compute the final unit price for a product (after discount).
export function productUnitPrice(price: number, discountPercent: number): number {
  return discountedPrice(price ?? 0, discountPercent ?? 0);
}

export const SHIPPING_FEE = parseInt(process.env.SHIPPING_FEE ?? "30000", 10);
export const FREE_SHIPPING_THRESHOLD = parseInt(process.env.FREE_SHIPPING_THRESHOLD ?? "1000000", 10);

export function computeShippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export const ORDER_STATUS_FLOW = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
] as const;

// COURSE orders skip PROCESSING/SHIPPING — go PAID -> COMPLETED
export const ORDER_STATUS_TRANSITIONS_PRODUCT: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_TRANSITIONS_COURSE: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function getStatusTransitions(orderType: string): Record<string, string[]> {
  return orderType === "COURSE" ? ORDER_STATUS_TRANSITIONS_COURSE : ORDER_STATUS_TRANSITIONS_PRODUCT;
}

// Process a paid order: create enrollments for course items + HOLD commissions for affiliates.
// Called from admin PATCH, VNPAY return, and MoMo IPN.
export async function processPaidOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { referredByAffiliateId: true } },
    },
  });
  if (!order) return;

  // Create enrollments for course items
  for (const it of order.items) {
    if (it.itemType === "COURSE" && it.courseId) {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: order.userId, courseId: it.courseId } },
      });
      if (!existing) {
        const couponUsage = await prisma.couponUsage.findFirst({
          where: { orderId: order.id },
          select: { couponId: true },
        });
        await prisma.enrollment.create({
          data: {
            userId: order.userId,
            courseId: it.courseId,
            orderId: order.id,
            paidAt: new Date(),
            source: couponUsage ? "COUPON" : "PAID",
          },
        });
        await prisma.course.update({
          where: { id: it.courseId },
          data: { studentsCount: { increment: 1 } },
        });
      }
    }
  }

  // Determine affiliate for commission (coupon > referredBy)
  const couponUsage = await prisma.couponUsage.findFirst({
    where: { orderId: order.id },
    include: { coupon: { select: { affiliateId: true } } },
  });
  const affiliateId = couponUsage?.coupon?.affiliateId ?? order.user?.referredByAffiliateId;
  if (affiliateId) {
    const aff = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    const already = await prisma.commission.findUnique({ where: { orderId: order.id } });
    if (aff && aff.status === "APPROVED" && !already) {
      const amount = computeCommission(order.subtotal, aff.commissionRate);
      if (amount > 0) {
        const holdDays = await getCommissionHoldDays();
        const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
        await prisma.commission.create({
          data: {
            affiliateId: aff.id,
            orderId: order.id,
            orderCode: order.orderCode,
            amount,
            rate: aff.commissionRate,
            status: "HOLD",
            holdUntil,
          },
        });
      }
    }
  }
}

// Build a VietQR image URL for bank transfer payment.
// Uses the free img.vietqr.io service (no API key required for image generation).
export function buildVietQrUrl(opts: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  addInfo: string;
}): string {
  const { bankCode, accountNumber, accountName, amount, addInfo } = opts;
  if (!bankCode || !accountNumber) return "";
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo,
    accountName,
  });
  return `${base}?${params.toString()}`;
}
