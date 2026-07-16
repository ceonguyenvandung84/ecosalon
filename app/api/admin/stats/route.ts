import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [courses, products, users, enrollments, reviews, recentUsers] =
      await Promise.all([
        prisma.course.count(),
        prisma.product.count(),
        prisma.user.count(),
        prisma.enrollment.count(),
        prisma.review.count(),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, fullName: true, email: true, role: true, createdAt: true },
        }),
      ]);

    // enrollments by category for chart
    const categories = await prisma.category.findMany({
      where: { type: "COURSE" },
      include: { _count: { select: { courses: true } } },
    });
    const courseByCategory = categories.map((c) => ({
      name: c.name,
      value: c._count?.courses ?? 0,
    }));

    // signups last 7 days
    const days: { name: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.user.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      days.push({
        name: `${start.getDate()}/${start.getMonth() + 1}`,
        value: count,
      });
    }

    return NextResponse.json({
      stats: { courses, products, users, enrollments, reviews },
      courseByCategory,
      signupsTrend: days,
      recentUsers,
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
