import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    orderBy: { completedAt: "desc" },
    take: 50,
    select: {
      id: true,
      score: true,
      passed: true,
      timeSpent: true,
      completedAt: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  const passRate = attempts.length > 0
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : 0;

  return NextResponse.json({
    quiz: {
      ...quiz,
      questions: undefined,
    },
    questions: quiz.questions,
    stats: {
      totalAttempts: quiz._count.attempts,
      avgScore,
      passRate,
    },
    attempts,
  });
}