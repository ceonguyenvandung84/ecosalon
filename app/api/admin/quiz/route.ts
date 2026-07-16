import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { select: { id: true, title: true, courseId: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return NextResponse.json({
    quizzes: quizzes.map((q) => ({
      ...q,
      questionCount: q._count.questions,
      attemptCount: q._count.attempts,
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { lessonId, title, description, passPercent, timeLimit, attemptLimit, isPublished } = body;

    if (!lessonId || !title) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const existing = await prisma.quiz.findUnique({ where: { lessonId } });
    if (existing) {
      return NextResponse.json({ error: "Quiz đã tồn tại cho bài học này" }, { status: 409 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId,
        title,
        description: description || null,
        passPercent: Number(passPercent) || 70,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        attemptLimit: Number(attemptLimit) || 0,
        isPublished: Boolean(isPublished),
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/quiz]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}