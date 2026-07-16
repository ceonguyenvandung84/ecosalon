import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: params.slug, isPublished: true },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { fullName: true, avatarPath: true, bio: true } },
        comments: {
          where: { isHidden: false },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true, avatarPath: true } } },
        },
      },
    });

    if (!post) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });

    // Increment view count (best-effort)
    prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    // Related posts in same category
    const related = await prisma.blogPost.findMany({
      where: { isPublished: true, id: { not: post.id }, categoryId: post.categoryId ?? undefined },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true },
    });

    const mappedPost = {
      ...post,
      coverImage: resolveImageUrl(post.coverImage),
      author: { ...post.author, avatarPath: resolveImageUrl(post.author?.avatarPath) },
      comments: post.comments.map((c) => ({ ...c, user: { ...c.user, avatarPath: resolveImageUrl(c.user?.avatarPath) } })),
    };
    const mappedRelated = related.map((r) => ({ ...r, coverImage: resolveImageUrl(r.coverImage) }));

    return NextResponse.json({ post: mappedPost, related: mappedRelated });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, vui lòng thử lại sau." }, { status: 500 });
  }
}
