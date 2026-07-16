import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { makeSlug } from "@/lib/community";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const search = searchParams.get("search") ?? "";

    const where: Prisma.BlogPostWhereInput = {};
    if (search) where.title = { contains: search };

    const [total, posts, categories] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
          isFeatured: true,
          viewCount: true,
          publishedAt: true,
          category: { select: { name: true } },
          author: { select: { fullName: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ posts, categories, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

    let body: Record<string, unknown> = {};
try { body = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(body).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    const title = (body?.title ?? "").toString().trim();
    const excerpt = (body?.excerpt ?? "").toString().trim();
    const content = (body?.content ?? "").toString().trim();
    if (!title) return NextResponse.json({ error: "Vui lòng nhập tiêu đề" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "Vui lòng nhập nội dung" }, { status: 400 });

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: makeSlug(title),
        excerpt: excerpt || content.slice(0, 160),
        content,
        coverImage: (body?.coverImage as string | null) ?? null,
        categoryId: (body?.categoryId as string | null) ?? null,
        authorId: admin.id,
        isPublished: (body?.isPublished as boolean) ?? true,
        isFeatured: (body?.isFeatured as boolean) ?? false,
      },
    });

    return NextResponse.json({ post });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
