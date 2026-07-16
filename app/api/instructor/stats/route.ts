import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireInstructor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    select: {
      id: true, title: true, slug: true, price: true, isPublished: true,
      _count: { select: { enrollments: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalStudents = await prisma.enrollment.count({
    where: { course: { instructorId: userId } },
  });

  const totalRevenue = await prisma.orderItem.aggregate({
    where: { course: { instructorId: userId }, order: { status: "PAID" } },
    _sum: { lineTotal: true },
  });

  const avgRating = await prisma.review.aggregate({
    where: { course: { instructorId: userId } },
    _avg: { rating: true },
    _count: true,
  });

  const profile = await prisma.instructorProfile.findUnique({ where: { userId } });

  return NextResponse.json({
    courses,
    stats: {
      totalCourses: courses.length,
      totalStudents,
      totalRevenue: totalRevenue._sum.lineTotal || 0,
      avgRating: avgRating._avg.rating || 0,
      reviewCount: avgRating._count,
    },
    profile,
  });
}