import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12));

    const where: Prisma.BlogPostWhereInput = { isPublished: true };
    if (categorySlug) where.category = { slug: categorySlug };
    if (featured === "true") where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    const [posts, total, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          viewCount: true,
          isFeatured: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { fullName: true, avatarPath: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.blogPost.count({ where }),
      prisma.blogCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, _count: { select: { posts: { where: { isPublished: true } } } } },
      }),
    ]);

    const mapped = posts.map((p) => ({
      ...p,
      coverImage: resolveImageUrl(p.coverImage),
      author: { ...p.author, avatarPath: resolveImageUrl(p.author?.avatarPath) },
    }));

    return NextResponse.json({ posts: mapped, categories, total, page, limit, totalPages: Math.ceil(total / limit) });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
