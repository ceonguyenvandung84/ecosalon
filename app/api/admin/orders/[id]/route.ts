import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { computeCommission, PAID_ORDER_STATUSES, getCommissionHoldDays } from "@/lib/affiliate";
import { createNotification } from "@/lib/notifications";
import { ORDER_STATUS_LABELS, getStatusTransitions } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, user: { select: { email: true, fullName: true } } },
    });
    if (!order) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    return NextResponse.json({
      order: {
        ...order,
        items: order.items.map((it) => ({
          ...it,
          productImage: resolveImageUrl(it.productImage),
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const status = (body?.status ?? "").toString();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, user: { select: { referredByAffiliateId: true } } },
    });
    if (!order) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });

    const transitions = getStatusTransitions(order.orderType);
    const allowedNext = transitions[order.status] ?? [];
    if (!allowedNext.includes(status)) {
      const currentLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
      const nextLabel = ORDER_STATUS_LABELS[status] ?? status;
      return NextResponse.json({
        error: `Không thể chuyển từ "${currentLabel}" sang "${nextLabel}". Chỉ có thể chuyển sang: ${allowedNext.map(s => ORDER_STATUS_LABELS[s] ?? s).join(", ")}.`
      }, { status: 400 });
    }

    const data: Record<string, unknown> = { status };
    if (status === "PAID" && !order.paidAt) data.paidAt = new Date();

    const wasPaid = PAID_ORDER_STATUSES.includes(order.status);
    const becomesPaid = PAID_ORDER_STATUSES.includes(status);

    let commissionInfo: { affiliateUserId: string; amount: number; orderCode: string } | null = null;

    const couponUsage = becomesPaid && !wasPaid
      ? await prisma.couponUsage.findFirst({ where: { orderId: order.id }, include: { coupon: { select: { affiliateId: true } } } })
      : null;
    const couponSource: "PAID" | "COUPON" = couponUsage ? "COUPON" : "PAID";

    // Determine affiliate: coupon's affiliate takes priority over referredBy
    const couponAffiliateId = couponUsage?.coupon?.affiliateId;
    const commissionTargetAffiliateId: string | null = (becomesPaid && !wasPaid)
      ? (couponAffiliateId ?? order.user?.referredByAffiliateId ?? null)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data });

      // Stock was already decremented at order creation (PENDING_PAYMENT), so only process enrollments here
      if (!wasPaid && becomesPaid) {
        for (const it of order.items) {
          if (it.itemType === "COURSE" && it.courseId) {
            const existingEnrollment = await tx.enrollment.findUnique({
              where: { userId_courseId: { userId: order.userId, courseId: it.courseId } },
            });
            if (!existingEnrollment) {
              await tx.enrollment.create({
                data: {
                  userId: order.userId,
                  courseId: it.courseId,
                  orderId: order.id,
                  paidAt: new Date(),
                  source: couponSource,
                },
              });
              await tx.course.update({
                where: { id: it.courseId },
                data: { studentsCount: { increment: 1 } },
              });
            }
          }
        }
      }

      // Restore stock if order is cancelled (only for items not yet paid)
      if (order.status !== "CANCELLED" && status === "CANCELLED") {
        for (const it of order.items) {
          if (it.itemType === "PRODUCT" && it.productId) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { increment: it.quantity }, soldCount: { decrement: it.quantity } },
            });
          }
        }
      }

      if (commissionTargetAffiliateId && becomesPaid && !wasPaid) {
        const aff = await tx.affiliate.findUnique({ where: { id: commissionTargetAffiliateId } });
        const already = await tx.commission.findUnique({ where: { orderId: order.id } });
        if (aff && aff.status === "APPROVED" && !already) {
          const amount = computeCommission(order.subtotal, aff.commissionRate);
          if (amount > 0) {
            const holdDays = await getCommissionHoldDays();
            const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
            await tx.commission.create({
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
            commissionInfo = { affiliateUserId: aff.userId, amount, orderCode: order.orderCode };
          }
        }
      }
    });

    if (order.userId && status !== order.status) {
      const label = ORDER_STATUS_LABELS[status] ?? status;
      const isPaidNow = !wasPaid && becomesPaid;
      const isCourseOrder = order.items.some((it) => it.itemType === "COURSE");

      await createNotification({
        userId: order.userId,
        type: isPaidNow ? "ORDER_PAID" : "ORDER_STATUS",
        title: isPaidNow ? "Thanh toán thành công!" : "Cập nhật đơn hàng",
        message: isPaidNow && isCourseOrder
          ? `Bạn đã được ghi danh khóa học từ đơn ${order.orderCode}. Chào mừng bạn đến với khóa học!`
          : `Đơn ${order.orderCode} hiện ở trạng thái: ${label}.`,
        link: isPaidNow && isCourseOrder ? `/khoa-hoc-cua-toi` : `/don-hang/${order.id}`,
      });
    }
    if (commissionInfo) {
      const ci = commissionInfo as { affiliateUserId: string; amount: number; orderCode: string };
      await createNotification({
        userId: ci.affiliateUserId,
        type: "AFFILIATE_COMMISSION",
        title: "Hoa hồng mới",
        message: `Bạn nhận ${formatPrice(ci.amount)} hoa hồng từ đơn ${ci.orderCode}.`,
        link: "/tiep-thi-lien-ket",
      });
    }

    await logActivity({ userId: admin.id, action: "UPDATE", entity: "Order", entityId: params.id, detail: `Cập nhật trạng thái đơn ${order.orderCode} từ "${order.status}" thành "${status}"` });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update order status error:", e);
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
