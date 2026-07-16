import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Returns forum categories with thread counts + recent threads overview.
export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        _count: { select: { threads: { where: { isHidden: false } } } },
      },
    });

    const recentThreads = await prisma.forumThread.findMany({
      where: { isHidden: false },
      orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        slug: true,
        isPinned: true,
        isLocked: true,
        viewCount: true,
        replyCount: true,
        lastReplyAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { fullName: true, avatarPath: true, role: true } },
      },
    });

    return NextResponse.json({ categories, recentThreads });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
