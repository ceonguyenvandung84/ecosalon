import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { lessonIds } = body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json({ error: "Danh sách bài học không hợp lệ" }, { status: 400 });
    }

    const updates = lessonIds.map((id: string, index: number) =>
      prisma.lesson.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
