import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [courses, products, users, enrollments] = await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.user.count(),
      prisma.enrollment.count(),
    ]);
    return NextResponse.json({
      courses,
      products,
      members: users,
      enrollments,
    });
  } catch {
    return NextResponse.json({ courses: 0, products: 0, members: 0, enrollments: 0 });
  }
}
