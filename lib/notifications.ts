import { prisma } from "./db";

export type NotificationType =
  | "ORDER_PAID"
  | "ORDER_STATUS"
  | "NEW_ENROLLMENT"
  | "NEW_REPLY"
  | "NEW_COMMENT"
  | "AFFILIATE_COMMISSION"
  | "AFFILIATE_STATUS"
  | "PAYOUT_STATUS"
  | "ADMIN_BROADCAST"
  | "MENTION"
  | "GENERAL";

export interface NotificationTypeMeta {
  label: string;
  icon: string; // lucide icon name
  color: string; // tailwind classes for icon chip
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  ORDER_PAID: { label: "Thanh toán", icon: "BadgeCheck", color: "bg-emerald-100 text-emerald-700" },
  ORDER_STATUS: { label: "Đơn hàng", icon: "Package", color: "bg-sky-100 text-sky-700" },
  NEW_ENROLLMENT: { label: "Ghi danh", icon: "GraduationCap", color: "bg-violet-100 text-violet-700" },
  NEW_REPLY: { label: "Trả lời", icon: "MessageSquare", color: "bg-amber-100 text-amber-700" },
  NEW_COMMENT: { label: "Bình luận", icon: "MessageCircle", color: "bg-amber-100 text-amber-700" },
  AFFILIATE_COMMISSION: { label: "Hoa hồng", icon: "Coins", color: "bg-emerald-100 text-emerald-700" },
  AFFILIATE_STATUS: { label: "Tiếp thị", icon: "Megaphone", color: "bg-teal-100 text-teal-700" },
  PAYOUT_STATUS: { label: "Rút tiền", icon: "Wallet", color: "bg-indigo-100 text-indigo-700" },
  ADMIN_BROADCAST: { label: "Thông báo", icon: "Bell", color: "bg-rose-100 text-rose-700" },
  MENTION: { label: "Mention", icon: "AtSign", color: "bg-purple-100 text-purple-700" },
  GENERAL: { label: "Chung", icon: "Bell", color: "bg-slate-100 text-slate-700" },
};

export function getNotificationMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[(type as NotificationType)] ?? NOTIFICATION_TYPE_META.GENERAL;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Tạo một thông báo cho người dùng. Không throw lỗi ra ngoài để tránh
 * làm hỏng luồng nghiệp vụ chính (đặt hàng, trả lời, v.v.).
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
}

/**
 * Gửi cùng một thông báo cho tất cả admin (vd: có đơn mới, đăng ký affiliate...).
 */
export async function notifyAdmins(input: Omit<CreateNotificationInput, "userId">) {
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      })),
    });
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}
