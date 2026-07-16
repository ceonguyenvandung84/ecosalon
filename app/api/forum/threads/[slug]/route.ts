import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const thread = await prisma.forumThread.findFirst({
      where: { slug: params.slug, isHidden: false },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { id: true, fullName: true, avatarPath: true, role: true } },
        replies: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, fullName: true, avatarPath: true, role: true } } },
        },
      },
    });

    if (!thread) return NextResponse.json({ error: "Không tìm thấy chủ đề" }, { status: 404 });

    prisma.forumThread.update({ where: { id: thread.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    // Attach certificate counts for thread author and all reply authors
    const userIds = new Set<string>();
    if (thread.author?.id) userIds.add(thread.author.id);
    for (const r of thread.replies ?? []) {
      if (r.author?.id) userIds.add(r.author.id);
    }

    let certCounts: Record<string, number> = {};
    if (userIds.size > 0) {
      const certs = await prisma.certificate.groupBy({
        by: ["userId"],
        where: { userId: { in: Array.from(userIds) }, isRevoked: false },
        _count: { userId: true },
      });
      for (const c of certs) {
        certCounts[c.userId] = c._count.userId;
      }
    }

    const enrich = (u: { id: string } | null | undefined) => ({
      ...u,
      certificateCount: (u?.id && certCounts[u.id]) ? certCounts[u.id] : 0,
    });

    const enriched = {
      ...thread,
      author: thread.author ? enrich(thread.author) : null,
      replies: thread.replies.map((r) => ({ ...r, author: r.author ? enrich(r.author) : null })),
    };

    return NextResponse.json({ thread: enriched });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
