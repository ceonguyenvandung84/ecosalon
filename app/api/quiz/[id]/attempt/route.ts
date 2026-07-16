import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-helpers";
import { parseJson, parseJsonArray } from "@/lib/enums";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { answers, startedAt, timeSpent } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Thiếu câu trả lời" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: "asc" } },
        lesson: { select: { id: true, title: true, courseId: true } },
      },
    });

    if (!quiz) return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });

    if (quiz.attemptLimit > 0) {
      const attemptCount = await prisma.quizAttempt.count({ where: { quizId, userId: user.id } });
      if (attemptCount >= quiz.attemptLimit) {
        return NextResponse.json({ error: "Đã hết lượt làm quiz" }, { status: 403 });
      }
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];

    for (const q of quiz.questions) {
      totalPoints += q.points || 1;
      const userAnswer = answers.find((a: { questionId: string; answer: string }) => a.questionId === q.id);
      const userAnswerText = userAnswer?.answer || "";

      let correct = false;
      let correctAnswerStr = "";

      switch (q.type) {
        case "MULTIPLE_CHOICE":
        case "TRUE_FALSE": {
          correctAnswerStr = q.correctAnswer || "";
          correct = userAnswerText.trim().toLowerCase() === correctAnswerStr.trim().toLowerCase();
          break;
        }
        case "FILL_IN": {
          correctAnswerStr = q.correctAnswer || "";
          const normalized = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
          correct = normalized(userAnswerText) === normalized(correctAnswerStr);
          break;
        }
        case "MATCHING": {
          const pairs = parseJson<Array<{ left: string; right: string }>>(q.matchedPairs, []);
          let userPairs: Array<{ left: string; right: string }> = [];
          try { userPairs = JSON.parse(userAnswerText) as Array<{ left: string; right: string }>; } catch { userPairs = []; }
          if (pairs && userPairs && pairs.length === userPairs.length) {
            correct = pairs.every((p, i) =>
              p.left.trim().toLowerCase() === userPairs[i]?.left.trim().toLowerCase() &&
              p.right.trim().toLowerCase() === userPairs[i]?.right.trim().toLowerCase()
            );
          }
          correctAnswerStr = JSON.stringify(pairs);
          break;
        }
        case "ORDERING": {
          const correctOrder = parseJsonArray<string>(q.correctOrder);
          let userOrder: string[] = [];
          try { userOrder = JSON.parse(userAnswerText) as string[]; } catch { userOrder = []; }
          if (correctOrder && userOrder && correctOrder.length === userOrder.length) {
            correct = correctOrder.every((item, i) => item.trim().toLowerCase() === userOrder[i]?.trim().toLowerCase());
          }
          correctAnswerStr = JSON.stringify(correctOrder);
          break;
        }
      }

      if (correct) earnedPoints += q.points || 1;

      results.push({
        questionId: q.id,
        type: q.type,
        text: q.text,
        userAnswer: userAnswerText,
        correct,
        correctAnswer: correctAnswerStr,
        explanation: q.explanation,
        points: q.points || 1,
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passPercent || 70);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        score,
        passed,
        answers: JSON.stringify(results),
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: new Date(),
        timeSpent: timeSpent ? Number(timeSpent) : null,
      },
    });

    if (passed && quiz.lesson) {
      const course = await prisma.course.findUnique({
        where: { id: quiz.lesson.courseId },
        select: { id: true, title: true, slug: true, instructor: { select: { fullName: true } } },
      });
      if (course) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
        });
        if (enrollment && enrollment.progress >= 100) {
          const existingCert = await prisma.certificate.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: course.id } },
          });
          if (!existingCert) {
            let template = await prisma.certificateTemplate.findFirst({ where: { isDefault: true, isActive: true } });
            if (!template) {
              template = await prisma.certificateTemplate.create({
                data: { title: "Mặc định", svgTemplate: "<svg></svg>", placeholder: JSON.stringify({}), isDefault: true, isActive: true },
              });
            }
            const number = `CERT-${course.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`;
            await prisma.certificate.create({
              data: {
                userId: user.id,
                courseId: course.id,
                templateId: template.id,
                enrollmentId: enrollment.id,
                certificateNumber: number,
                studentName: user.fullName || user.name || "Học viên",
                courseTitle: course.title,
                instructorName: course.instructor?.fullName || null,
                completionDate: new Date(),
                metadata: JSON.stringify({}),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score,
        passed,
        totalPoints,
        earnedPoints,
        passPercent: quiz.passPercent,
        results,
        timeSpent: attempt.timeSpent,
      },
    });
  } catch (err) {
    console.error("[POST /api/quiz/[id]/attempt]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: user.id },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ attempts });
}