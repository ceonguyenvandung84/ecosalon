import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      lesson: { select: { id: true, title: true, courseId: true } },
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });

  return NextResponse.json({ quiz });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, passPercent, timeLimit, attemptLimit, isPublished } = body;

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        passPercent: passPercent !== undefined ? Number(passPercent) : undefined,
        timeLimit: timeLimit !== undefined ? (timeLimit ? Number(timeLimit) : null) : undefined,
        attemptLimit: attemptLimit !== undefined ? Number(attemptLimit) : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      },
    });

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error("[PUT /api/admin/quiz/[id]]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/quiz/[id]]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}