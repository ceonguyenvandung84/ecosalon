import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number | null | undefined): string {
  const v = value ?? 0
  return new Intl.NumberFormat("vi-VN").format(v) + "đ"
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

export function slugify(str: string): string {
  return (str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function discountedPrice(price: number, discountPercent: number): number {
  const p = price ?? 0
  const d = discountPercent ?? 0
  return Math.round(p * (1 - d / 100))
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return dateFormatter.format(d)
}
