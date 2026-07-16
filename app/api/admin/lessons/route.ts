import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json({ lessons });
}