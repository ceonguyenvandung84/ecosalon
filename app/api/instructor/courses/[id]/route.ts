import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const user = await requireInstructor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = await prisma.course.findUnique({
    where: { id: courseId, instructorId: user.id },
    include: {
      instructor: { select: { id: true, fullName: true } },
      _count: { select: { lessons: true, reviews: true, enrollments: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        take: 50,
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarPath: true } },
        },
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const avgRating = await prisma.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
  });

  const questions = await prisma.courseQuestion.count({ where: { courseId, isResolved: false } });

  return NextResponse.json({
    course: {
      ...course,
      avgRating: avgRating._avg.rating || 0,
      unansweredQuestions: questions,
    },
  });
}