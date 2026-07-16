import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import { CourseLevel } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const level = sp.get("level");
    const q = sp.get("q");
    const sort = sp.get("sort") ?? "newest";
    const featured = sp.get("featured");
    const minPrice = parseInt(sp.get("minPrice") ?? "", 10);
    const maxPrice = parseInt(sp.get("maxPrice") ?? "", 10);

    const where: Prisma.CourseWhereInput = { isPublished: true };
    if (category) where.category = { slug: category };
    if (level) where.level = level as CourseLevel;
    if (featured === "true") where.isFeatured = true;
    if (q) where.title = { contains: q };
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {} as Prisma.IntFilter;
      if (!Number.isNaN(minPrice)) (where.price as Prisma.IntFilter).gte = minPrice;
      if (!Number.isNaN(maxPrice)) (where.price as Prisma.IntFilter).lte = maxPrice;
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "popular") orderBy = { studentsCount: "desc" };

    // Phân trang: mặc định tối đa 60 khóa học/lần.
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "60", 10) || 60));

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          reviews: { select: { rating: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const data = courses.map((c) => {
      const ratings = c.reviews ?? [];
      const avg =
        ratings.length > 0
          ? ratings.reduce((s, r) => s + (r?.rating ?? 0), 0) / ratings.length
          : 0;
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        shortDesc: c.shortDesc,
        thumbnail: resolveImageUrl(c.thumbnailPath),
        price: c.price,
        discountPrice: c.discountPrice,
        level: c.level,
        durationHours: c.durationHours,
        instructorName: c.instructorName,
        instructorAvatar: resolveImageUrl(c.instructorAvatar),
        category: c.category?.name ?? "",
        categorySlug: c.category?.slug ?? "",
        rating: Math.round(avg * 10) / 10,
        reviewsCount: ratings.length,
        lessonsCount: c._count?.lessons ?? 0,
        studentsCount: c.studentsCount,
        isFeatured: c.isFeatured,
      };
    });
    return NextResponse.json({ courses: data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    console.error("GET /api/courses error:", e);
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
