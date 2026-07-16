import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    const reply = await prisma.forumReply.findUnique({ where: { id: params.id }, select: { threadId: true } });
    if (!reply) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.forumReply.delete({ where: { id: params.id } });
      await tx.forumThread.update({ where: { id: reply.threadId }, data: { replyCount: { decrement: 1 } } });
    });
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
