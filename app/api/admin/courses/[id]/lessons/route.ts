import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils";
import { parseJson } from "@/lib/enums";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lessons = await prisma.lesson.findMany({
      where: { courseId: params.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(
      lessons.map((l) => ({ ...l, attachments: parseJson(l.attachments, null) }))
    );
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, content, videoUrl, videoProvider, thumbnailPath, attachments, durationMin, isPreview, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: "Tiêu đề bài học là bắt buộc" }, { status: 400 });
    }

    const slug = slugify(title);

    const maxOrder = await prisma.lesson.findFirst({
      where: { courseId: params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        courseId: params.id,
        title,
        slug,
        description: description || null,
        content: content || null,
        videoUrl: videoUrl || null,
        videoProvider: videoProvider || "YOUTUBE",
        thumbnailPath: thumbnailPath || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        durationMin: durationMin || 0,
        order: (maxOrder?.order ?? -1) + 1,
        isPreview: isPreview || false,
        isPublished: isPublished ?? true,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
