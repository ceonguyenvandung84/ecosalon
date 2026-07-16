// CRM constants & helpers for SALON HAIR SYSTEM admin customer management

export interface CustomerTagDef {
  value: string;
  label: string;
  color: string; // tailwind classes for badge
}

// Predefined customer tags admins can assign
export const CUSTOMER_TAGS: CustomerTagDef[] = [
  { value: "vip", label: "VIP", color: "bg-amber-100 text-amber-700" },
  { value: "tiem-nang", label: "Tiềm năng", color: "bg-sky-100 text-sky-700" },
  { value: "khach-moi", label: "Khách mới", color: "bg-emerald-100 text-emerald-700" },
  { value: "than-thiet", label: "Thân thiết", color: "bg-violet-100 text-violet-700" },
  { value: "can-cham-soc", label: "Cần chăm sóc", color: "bg-rose-100 text-rose-700" },
  { value: "doanh-nghiep", label: "Doanh nghiệp", color: "bg-slate-200 text-slate-700" },
];

export const CUSTOMER_TAG_VALUES = CUSTOMER_TAGS.map((t) => t.value);

export function getTagDef(value: string): CustomerTagDef {
  return (
    CUSTOMER_TAGS.find((t) => t.value === value) ?? {
      value,
      label: value,
      color: "bg-secondary text-secondary-foreground",
    }
  );
}

// Spend tier thresholds (VND) used for segmentation filters
export const SPEND_TIERS = [
  { value: "all", label: "Tất cả mức chi", min: 0 },
  { value: "new", label: "Chưa mua hàng", min: -1 }, // special: total == 0
  { value: "low", label: "Dưới 1 triệu", min: 1 },
  { value: "mid", label: "1 - 5 triệu", min: 1000000 },
  { value: "high", label: "Trên 5 triệu", min: 5000000 },
];

// Order statuses considered as realized revenue (paid)
export const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPING", "COMPLETED"] as const;

export function spendTier(total: number): string {
  if (total <= 0) return "new";
  if (total < 1000000) return "low";
  if (total < 5000000) return "mid";
  return "high";
}
