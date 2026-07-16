import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const where: Record<string, unknown> = {};
    if (search) where.title = { contains: search };
    const [total, threads] = await Promise.all([
      prisma.forumThread.count({ where }),
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          isPinned: true,
          isLocked: true,
          isHidden: true,
          viewCount: true,
          replyCount: true,
          lastReplyAt: true,
          category: { select: { name: true } },
          author: { select: { fullName: true } },
        },
      }),
    ]);
    return NextResponse.json({ threads, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
