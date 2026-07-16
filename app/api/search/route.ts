import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ courses: [], products: [], posts: [], threads: [] });
    }

    const [courses, products, posts, threads] = await Promise.all([
      prisma.course.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { shortDesc: { contains: q } },
          ],
        },
        select: { id: true, title: true, slug: true, shortDesc: true, thumbnailPath: true, price: true, discountPrice: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { shortDesc: { contains: q } },
          ],
        },
        select: { id: true, title: true, slug: true, shortDesc: true, images: true, price: true, discountPercent: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.blogPost.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { excerpt: { contains: q } },
          ],
        },
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.forumThread.findMany({
        where: {
          isHidden: false,
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        select: { id: true, title: true, slug: true, viewCount: true, replyCount: true, category: { select: { name: true } } },
        take: 5,
        orderBy: { lastReplyAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      courses,
      products: products.map((pr) => ({ ...pr, images: parseJsonArray(pr.images) })),
      posts,
      threads,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}