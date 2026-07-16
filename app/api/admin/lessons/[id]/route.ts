import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { parseJson } from "@/lib/enums";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, content, videoUrl, videoProvider, thumbnailPath, attachments, durationMin, order, isPreview, isPublished } = body;

    const existing = await prisma.lesson.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title, slug: slugify(title) }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content: sanitize(content) }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoProvider !== undefined && { videoProvider }),
        ...(thumbnailPath !== undefined && { thumbnailPath }),
        ...(attachments !== undefined && { attachments: attachments ? JSON.stringify(attachments) : null }),
        ...(durationMin !== undefined && { durationMin }),
        ...(order !== undefined && { order }),
        ...(isPreview !== undefined && { isPreview }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json(lesson);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.lesson.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    await prisma.lesson.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
