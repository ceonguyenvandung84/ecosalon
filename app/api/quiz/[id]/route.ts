import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import { parseJson, parseJsonArray } from "@/lib/enums";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, isPublished: true },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          text: true,
          options: true,
          matchedPairs: true,
          correctOrder: true,
          order: true,
          points: true,
        },
      },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });

  const questions = quiz.questions.map((q) => ({
    ...q,
    options: parseJsonArray<string>(q.options),
    matchedPairs: parseJson<Array<{ left: string; right: string }>>(q.matchedPairs, []),
    correctOrder: parseJsonArray<string>(q.correctOrder),
  }));

  const existingAttempt = quiz.attemptLimit > 0
    ? await prisma.quizAttempt.count({ where: { quizId, userId: user.id } }) >= quiz.attemptLimit
    : false;

  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { quizId, userId: user.id },
    orderBy: { completedAt: "desc" },
    select: { score: true, passed: true, completedAt: true },
  });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passPercent: quiz.passPercent,
      timeLimit: quiz.timeLimit,
      attemptLimit: quiz.attemptLimit,
      attemptUsed: await prisma.quizAttempt.count({ where: { quizId, userId: user.id } }),
      questions,
      lesson: quiz.lesson,
      lastAttempt,
      locked: existingAttempt,
    },
  });
}