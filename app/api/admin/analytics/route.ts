import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { PAID_ORDER_STATUSES } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const PAID = PAID_ORDER_STATUSES as unknown as string[];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 7), 365);

    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    // --- Dữ liệu đơn trong khoảng thời gian ---
    const ordersInRange = await prisma.order.findMany({
      where: { createdAt: { gte: start } },
      select: { id: true, total: true, subtotal: true, status: true, createdAt: true },
    });

    const paidOrders = ordersInRange.filter((o) => PAID.includes(o.status));
    const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
    const paidCount = paidOrders.length;
    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    // --- Doanh thu & đơn theo ngày ---
    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      revenueMap.set(dayKey(d), { revenue: 0, orders: 0 });
    }
    for (const o of paidOrders) {
      const k = dayKey(new Date(o.createdAt));
      const cur = revenueMap.get(k);
      if (cur) {
        cur.revenue += o.total;
        cur.orders += 1;
      }
    }
    const revenueTrend = Array.from(revenueMap.entries()).map(([k, v]) => {
      const [, m, d] = k.split("-");
      return { name: `${Number(d)}/${Number(m)}`, revenue: v.revenue, orders: v.orders };
    });

    // --- Trạng thái đơn (toàn bộ, không giới hạn thời gian) ---
    const statusGroups = await prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const ordersByStatus = statusGroups.map((g) => ({ status: g.status as string, count: g._count._all }));

    // --- Khách hàng mới theo ngày ---
    const newUsers = await prisma.user.findMany({
      where: { role: "USER", createdAt: { gte: start } },
      select: { createdAt: true },
    });
    const userMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      userMap.set(dayKey(d), 0);
    }
    for (const u of newUsers) {
      const k = dayKey(new Date(u.createdAt));
      if (userMap.has(k)) userMap.set(k, (userMap.get(k) ?? 0) + 1);
    }
    const newCustomersTrend = Array.from(userMap.entries()).map(([k, v]) => {
      const [, m, d] = k.split("-");
      return { name: `${Number(d)}/${Number(m)}`, value: v };
    });

    // --- Sản phẩm bán chạy (đơn đã thanh toán trong khoảng) ---
    const paidOrderIds = paidOrders.map((o) => o.id);
    let topProducts: { name: string; quantity: number; revenue: number }[] = [];
    if (paidOrderIds.length > 0) {
      const items = await prisma.orderItem.findMany({
        where: { orderId: { in: paidOrderIds } },
        select: { productTitle: true, quantity: true, lineTotal: true },
      });
      const pmap = new Map<string, { quantity: number; revenue: number }>();
      for (const it of items) {
        const cur = pmap.get(it.productTitle) ?? { quantity: 0, revenue: 0 };
        cur.quantity += it.quantity;
        cur.revenue += it.lineTotal;
        pmap.set(it.productTitle, cur);
      }
      topProducts = Array.from(pmap.entries())
        .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
    }

    // --- Khóa học ghi danh nhiều nhất trong khoảng ---
    const enrollGroups = await prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { enrolledAt: { gte: start } },
      _count: { _all: true },
    });
    const courseIds = enrollGroups.map((g) => g.courseId);
    const courses = courseIds.length
      ? await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } })
      : [];
    const courseTitle = new Map(courses.map((c) => [c.id, c.title]));
    const topCourses = enrollGroups
      .map((g) => ({ name: courseTitle.get(g.courseId) ?? "Khóa học", value: g._count._all }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // --- Top đối tác tiếp thị ---
    const topAffiliatesRaw = await prisma.affiliate.findMany({
      orderBy: { totalEarned: "desc" },
      take: 5,
      where: { totalEarned: { gt: 0 } },
      select: { totalEarned: true, clickCount: true, user: { select: { fullName: true } } },
    });
    const topAffiliates = topAffiliatesRaw.map((a) => ({
      name: a.user?.fullName ?? "Đối tác",
      totalEarned: a.totalEarned,
      clicks: a.clickCount,
    }));

    // --- Top bài viết theo lượt xem ---
    const topPostsRaw = await prisma.blogPost.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { title: true, viewCount: true, slug: true },
    });
    const topPosts = topPostsRaw.map((p) => ({ name: p.title, value: p.viewCount, slug: p.slug }));

    // --- Top chủ đề diễn đàn theo lượt xem ---
    const topThreadsRaw = await prisma.forumThread.findMany({
      where: { isHidden: false },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { title: true, viewCount: true, replyCount: true, slug: true },
    });
    const topThreads = topThreadsRaw.map((t) => ({ name: t.title, views: t.viewCount, replies: t.replyCount, slug: t.slug }));

    // --- Tổng quan bổ sung ---
    const newCustomers = newUsers.length;
    const totalOrders = ordersInRange.length;

    return NextResponse.json({
      range: { days, start: start.toISOString(), end: now.toISOString() },
      summary: { totalRevenue, paidCount, totalOrders, aov, newCustomers },
      revenueTrend,
      ordersByStatus,
      newCustomersTrend,
      topProducts,
      topCourses,
      topAffiliates,
      topPosts,
      topThreads,
    });
  } catch (err) {
    console.error("GET analytics error:", err);
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
