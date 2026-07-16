// Affiliate / referral helpers

import { prisma } from "./db";

export const DEFAULT_COMMISSION_RATE = parseInt(process.env.DEFAULT_COMMISSION_RATE ?? "10", 10);
export const MIN_PAYOUT = parseInt(process.env.MIN_PAYOUT ?? "200000", 10);
export const REFERRAL_COOKIE = "shs_ref";

export async function getCommissionHoldDays(): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "commission_hold_days" } });
    if (setting?.value) {
      const days = parseInt(setting.value, 10);
      if (!isNaN(days) && days > 0) return days;
    }
  } catch { /* ignore */ }
  return 30;
}

// Generate a short, human-friendly affiliate code from a name + random suffix.
export function generateAffiliateCode(fullName?: string): string {
  const base = (fullName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return base ? `${base}${rand}` : `SHS${rand}`;
}

export const AFFILIATE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  SUSPENDED: "Tạm khóa",
};

export const AFFILIATE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SUSPENDED: "bg-gray-200 text-gray-700",
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  HOLD: "Đang đóng băng",
  PENDING: "Chờ xác nhận",
  APPROVED: "Đã ghi nhận",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export const COMMISSION_STATUS_COLORS: Record<string, string> = {
  HOLD: "bg-orange-100 text-orange-700",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã chi trả",
  REJECTED: "Từ chối",
};

export const PAYOUT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export const PAID_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPING", "COMPLETED"];

export function computeCommission(subtotal: number, rate: number): number {
  return Math.max(0, Math.round((subtotal * (rate ?? 0)) / 100));
}

// Build a referral link for a given affiliate code, based on a base origin.
export function buildReferralLink(origin: string, code: string): string {
  const clean = (origin ?? "").replace(/\/$/, "");
  return `${clean}/?ref=${encodeURIComponent(code)}`;
}
