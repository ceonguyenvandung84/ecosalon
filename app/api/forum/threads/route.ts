import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { makeSlug } from "@/lib/community";
import { sanitize, sanitizePlain } from "@/lib/sanitize";
import { apiLimiter } from "@/lib/rate-limit";
import { forumThreadSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// List threads (optionally filtered by category slug / search).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = { isHidden: false };
    if (categorySlug) where.category = { slug: categorySlug };
    if (search) where.title = { contains: search };

    const [threads, category] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
        take: 100, // giới hạn an toàn, tránh tải toàn bộ chủ đề khi diễn đàn lớn dần
        select: {
          id: true,
          title: true,
          slug: true,
          isPinned: true,
          isLocked: true,
          viewCount: true,
          replyCount: true,
          lastReplyAt: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { fullName: true, avatarPath: true, role: true } },
        },
      }),
      categorySlug ? prisma.forumCategory.findUnique({ where: { slug: categorySlug }, select: { name: true, slug: true, description: true } }) : Promise.resolve(null),
    ]);

    return NextResponse.json({ threads, category });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

// Create a new thread.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = apiLimiter(`forum:${ip}`);
    if (!allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }, { status: 429 });
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const parsed = forumThreadSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    const title = sanitizePlain(parsed.data.title).trim();
    const content = sanitize(parsed.data.content).trim();
    const categoryId = parsed.data.categoryId;

    const category = await prisma.forumCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) return NextResponse.json({ error: "Chuyên mục không hợp lệ" }, { status: 400 });

    const thread = await prisma.forumThread.create({
      data: {
        title,
        slug: makeSlug(title),
        content,
        categoryId,
        authorId: user.id,
        lastReplyAt: new Date(),
      },
      select: { slug: true },
    });

    return NextResponse.json({ thread });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
