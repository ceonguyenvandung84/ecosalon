import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { resolveImageUrl } from "@/lib/s3";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { Prisma } from "@prisma/client";
import { parseJsonArray } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";

    const where: Prisma.ProductWhereInput = {};
    if (search) where.title = { contains: search };
    if (categoryId) where.categoryId = categoryId;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true, brand: true },
      }),
    ]);
    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDesc: p.shortDesc,
        description: p.description,
        image: resolveImageUrl((parseJsonArray(p.images)[0]) ?? ""),
        images: parseJsonArray(p.images).map((i) => resolveImageUrl(i)),
        price: p.price,
        discountPercent: p.discountPercent,
        stock: p.stock,
        sku: p.sku,
        category: p.category?.name ?? "",
        categoryId: p.categoryId,
        brand: p.brand?.name ?? "",
        brandId: p.brandId,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        soldCount: p.soldCount,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        ogImage: p.ogImage,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ products: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    let b: Record<string, unknown> = {};
try { b = await req.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
if (Object.keys(b).length === 0) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    if (!b?.title || !b?.categoryId) {
      return NextResponse.json({ error: "Thiếu tiêu đề hoặc danh mục." }, { status: 400 });
    }
    let slug = slugify(b.title as string);
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString().slice(-5)}`;
    const product = await prisma.product.create({
      data: {
        title: b.title as string,
        slug,
        shortDesc: (b.shortDesc as string) ?? "",
        description: (b.description as string) ?? "",
        images: JSON.stringify(Array.isArray(b.images) ? b.images.filter(Boolean) : []),
        price: parseInt((b.price as string) ?? "0", 10) || 0,
        discountPercent: parseInt((b.discountPercent as string) ?? "0", 10) || 0,
        categoryId: b.categoryId as string,
        brandId: (b.brandId as string | null) ?? null,
        stock: parseInt((b.stock as string) ?? "0", 10) || 0,
        sku: (b.sku as string | null) ?? null,
        specifications: JSON.stringify(b.specifications ?? null),
        isPublished: (b.isPublished as boolean) ?? true,
        isFeatured: (b.isFeatured as boolean) ?? false,
        metaTitle: (b.metaTitle as string | null) ?? null,
        metaDescription: (b.metaDescription as string | null) ?? null,
        ogImage: (b.ogImage as string | null) ?? null,
      },
    });
    await logActivity({ userId: admin.id, action: "CREATE", entity: "Product", entityId: product.id, detail: `Tạo sản phẩm "${product.title}"` });
    return NextResponse.json({ success: true, id: product.id });
  } catch {
    return NextResponse.json({ error: "Tạo sản phẩm thất bại." }, { status: 500 });
  }
}
