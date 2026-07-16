import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/enums";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { type, text, options, correctAnswer, matchedPairs, correctOrder, explanation, order, points } = body;

    if (!type || !text) {
      return NextResponse.json({ error: "Thiếu thông tin câu hỏi" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        type,
        text,
        options: options ? JSON.stringify(options) : null,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : null,
        matchedPairs: matchedPairs ? JSON.stringify(matchedPairs) : null,
        correctOrder: correctOrder ? JSON.stringify(correctOrder) : null,
        explanation: explanation || null,
        order: Number(order) || 0,
        points: Number(points) || 1,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/quiz/[id]/questions]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { questionId, type, text, options, correctAnswer, matchedPairs, correctOrder, explanation, order, points } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Thiếu questionId" }, { status: 400 });
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: type || undefined,
        text: text || undefined,
        options: options !== undefined ? (options ? JSON.stringify(options) : null) : undefined,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : undefined,
        matchedPairs: matchedPairs !== undefined ? (matchedPairs ? JSON.stringify(matchedPairs) : null) : undefined,
        correctOrder: correctOrder !== undefined ? (correctOrder ? JSON.stringify(correctOrder) : null) : undefined,
        explanation: explanation !== undefined ? explanation : undefined,
        order: order !== undefined ? Number(order) : undefined,
        points: points !== undefined ? Number(points) : undefined,
      },
    });

    return NextResponse.json({ question });
  } catch (err) {
    console.error("[PUT /api/admin/quiz/[id]/questions]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "Thiếu questionId" }, { status: 400 });
    }

    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/quiz/[id]/questions]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}