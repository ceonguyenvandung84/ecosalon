import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import { parseJsonArray, parseJson } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        brand: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true } } },
        },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }
    const ratings = product.reviews ?? [];
    const avg =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + (r?.rating ?? 0), 0) / ratings.length
        : 0;
    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        shortDesc: product.shortDesc,
        description: product.description,
        images: parseJsonArray(product.images).map((i) => resolveImageUrl(i)),
        price: product.price,
        discountPercent: product.discountPercent,
        category: product.category?.name ?? "",
        categorySlug: product.category?.slug ?? "",
        brand: product.brand?.name ?? "",
        stock: product.stock,
        sku: product.sku,
        specifications: parseJson(product.specifications, {}),
        soldCount: product.soldCount,
        rating: Math.round(avg * 10) / 10,
        reviewsCount: ratings.length,
        reviews: ratings.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          userName: r.user?.fullName ?? "Ẩn danh",
          createdAt: r.createdAt,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
