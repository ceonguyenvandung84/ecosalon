import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");
    const brand = sp.get("brand");
    const q = sp.get("q");
    const sort = sp.get("sort") ?? "newest";
    const featured = sp.get("featured");
    const minPrice = parseInt(sp.get("minPrice") ?? "", 10);
    const maxPrice = parseInt(sp.get("maxPrice") ?? "", 10);

    const where: Prisma.ProductWhereInput = { isPublished: true };
    if (category) where.category = { slug: category };
    if (brand) where.brand = { slug: brand };
    if (featured === "true") where.isFeatured = true;
    if (q) where.title = { contains: q };
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      where.price = {} as Prisma.IntFilter;
      if (!Number.isNaN(minPrice)) (where.price as Prisma.IntFilter).gte = minPrice;
      if (!Number.isNaN(maxPrice)) (where.price as Prisma.IntFilter).lte = maxPrice;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "popular") orderBy = { soldCount: "desc" };

    // Phân trang: mặc định lấy tối đa 60 sản phẩm/lần để tránh tải toàn bộ catalogue cùng lúc.
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "60", 10) || 60));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          brand: true,
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const data = products.map((p) => {
      const ratings = p.reviews ?? [];
      const avg =
        ratings.length > 0
          ? ratings.reduce((s, r) => s + (r?.rating ?? 0), 0) / ratings.length
          : 0;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDesc: p.shortDesc,
        image: resolveImageUrl(parseJsonArray(p.images)[0] ?? ""),
        price: p.price,
        discountPercent: p.discountPercent,
        category: p.category?.name ?? "",
        categorySlug: p.category?.slug ?? "",
        brand: p.brand?.name ?? "",
        brandSlug: p.brand?.slug ?? "",
        stock: p.stock,
        rating: Math.round(avg * 10) / 10,
        reviewsCount: ratings.length,
        soldCount: p.soldCount,
        isFeatured: p.isFeatured,
      };
    });
    return NextResponse.json({ products: data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    console.error("GET /api/products error:", e);
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
