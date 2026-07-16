import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { createNotification } from "@/lib/notifications";
import { sanitize } from "@/lib/sanitize";
import { apiLimiter } from "@/lib/rate-limit";
import { forumReplySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function extractMentions(content: string): string[] {
  const matches = content.match(/@(\S+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).replace(/[.,!?;:]+$/, "")))];
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = apiLimiter(`forum:${ip}`);
    if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = forumReplySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const content = sanitize(parsed.data.content).trim();

    const thread = await prisma.forumThread.findFirst({ where: { slug: params.slug, isHidden: false }, select: { id: true, isLocked: true, title: true, slug: true, authorId: true } });
    if (!thread) return NextResponse.json({ error: "Không tìm thấy chủ đề" }, { status: 404 });
    if (thread.isLocked) return NextResponse.json({ error: "Chủ đề đã bị khóa" }, { status: 403 });

    const reply = await prisma.$transaction(async (tx) => {
      const r = await tx.forumReply.create({
        data: { threadId: thread.id, authorId: user.id, content },
        include: { author: { select: { id: true, fullName: true, avatarPath: true, role: true } } },
      });
      await tx.forumThread.update({
        where: { id: thread.id },
        data: { replyCount: { increment: 1 }, lastReplyAt: new Date() },
      });
      return r;
    });

    // Attach certificate count to reply author
    const certCount = await prisma.certificate.count({
      where: { userId: user.id, isRevoked: false },
    });
    (reply as Record<string, unknown>).author = {
      ...reply.author,
      certificateCount: certCount,
    };

    const authorId = user.id;
    const authorName = user.name ?? user.fullName ?? "Một thành viên";

    if (thread.authorId && thread.authorId !== authorId) {
      await createNotification({
        userId: thread.authorId,
        type: "NEW_REPLY",
        title: "Có trả lời mới",
        message: `${authorName} đã trả lời chủ đề “${thread.title}”.`,
        link: `/dien-dan/${thread.slug}`,
      });
    }

    const mentionNames = extractMentions(content);
    if (mentionNames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { fullName: { in: mentionNames }, isActive: true },
        select: { id: true, fullName: true },
      });
      for (const mu of mentionedUsers) {
        if (mu.id === authorId || mu.id === thread.authorId) continue;
        await createNotification({
          userId: mu.id,
          type: "MENTION",
          title: "Bạn được nhắc đến",
          message: `${authorName} đã nhắc đến bạn trong chủ đề “${thread.title}”.`,
          link: `/dien-dan/${thread.slug}`,
        });
      }
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
