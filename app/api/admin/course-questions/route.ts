import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const questions = await prisma.courseQuestion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { answers: true } },
      },
    });
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
