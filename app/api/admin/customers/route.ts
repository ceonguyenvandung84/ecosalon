import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { PAID_STATUSES } from "@/lib/crm";
import type { OrderStatus } from "@/lib/enums";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // All non-admin users are treated as customers
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarPath: true,
        isActive: true,
        tags: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate paid orders by user
    const paidAgg = await prisma.order.groupBy({
      by: ["userId"],
      where: { status: { in: PAID_STATUSES as unknown as OrderStatus[] } },
      _sum: { total: true },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const paidMap = new Map(
      paidAgg.map((a) => [a.userId, { total: a._sum?.total ?? 0, count: a._count?._all ?? 0, last: a._max?.createdAt }])
    );

    // Total order count (any status) + last order date for activity
    const allAgg = await prisma.order.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _max: { createdAt: true },
    });
    const allMap = new Map(allAgg.map((a) => [a.userId, { count: a._count._all, last: a._max.createdAt }]));

    // Enrollment counts + last enroll date
    const enrollAgg = await prisma.enrollment.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _max: { enrolledAt: true },
    });
    const enrollMap = new Map(
      enrollAgg.map((a) => [a.userId, { count: a._count._all, last: a._max.enrolledAt }])
    );

    const customers = users.map((u) => {
      const paid = paidMap.get(u.id);
      const all = allMap.get(u.id);
      const enr = enrollMap.get(u.id);
      const activityDates = [u.createdAt, all?.last, enr?.last].filter(Boolean) as Date[];
      const lastActivity = activityDates.length
        ? new Date(Math.max(...activityDates.map((d) => new Date(d).getTime())))
        : u.createdAt;
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        avatar: u.avatarPath ? resolveImageUrl(u.avatarPath) : "",
        isActive: u.isActive,
        tags: parseJsonArray(u.tags),
        createdAt: u.createdAt,
        totalSpent: paid?.total ?? 0,
        paidOrderCount: paid?.count ?? 0,
        orderCount: all?.count ?? 0,
        enrollmentCount: enr?.count ?? 0,
        lastActivity,
      };
    });

    // Summary stats
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
    const payingCustomers = customers.filter((c) => c.totalSpent > 0).length;

    return NextResponse.json({
      customers,
      summary: {
        totalCustomers: customers.length,
        payingCustomers,
        totalRevenue,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
