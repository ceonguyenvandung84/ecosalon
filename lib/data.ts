import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { resolveImageUrl } from "@/lib/s3";
import { parseJsonArray } from "@/lib/enums";

type CourseCardData = Prisma.CourseGetPayload<{
  include: {
    category: true;
    reviews: { select: { rating: true } };
    _count: { select: { lessons: true; enrollments: true } };
  };
}>;

type ProductCardData = Prisma.ProductGetPayload<{
  include: {
    category: true;
    brand: true;
    reviews: { select: { rating: true } };
  };
}>;

export async function getFeaturedCourses(limit = 4) {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true, isFeatured: true },
      take: limit,
      orderBy: { studentsCount: "desc" },
      include: {
        category: true,
        reviews: { select: { rating: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    return courses.map(mapCourse);
  } catch {
    return [];
  }
}

export async function getFeaturedProducts(limit = 5) {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      take: limit,
      orderBy: { soldCount: "desc" },
      include: { category: true, brand: true, reviews: { select: { rating: true } } },
    });
    return products.map(mapProduct);
  } catch {
    return [];
  }
}

function mapCourse(c: CourseCardData) {
  const ratings = c.reviews;
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    shortDesc: c.shortDesc,
    thumbnail: resolveImageUrl(c.thumbnailPath ?? undefined),
    price: c.price,
    discountPrice: c.discountPrice,
    level: c.level,
    durationHours: c.durationHours,
    instructorName: c.instructorName,
    category: c.category?.name ?? "",
    rating: Math.round(avg * 10) / 10,
    reviewsCount: ratings.length,
    lessonsCount: c._count.lessons,
    studentsCount: c.studentsCount,
  };
}

function mapProduct(p: ProductCardData) {
  const ratings = p.reviews;
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDesc: p.shortDesc,
    image: resolveImageUrl(parseJsonArray(p.images)[0] ?? undefined),
    price: p.price,
    discountPercent: p.discountPercent,
    category: p.category?.name ?? "",
    brand: p.brand?.name ?? "",
    rating: Math.round(avg * 10) / 10,
    reviewsCount: ratings.length,
    soldCount: p.soldCount,
  };
}

export async function getStats() {
  try {
    const [courses, products, students] = await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.user.count(),
    ]);
    const agg = await prisma.course.aggregate({ _sum: { studentsCount: true } });
    return {
      courses,
      products,
      students: (agg?._sum?.studentsCount ?? 0) + students,
      satisfaction: 98,
    };
  } catch {
    return { courses: 0, products: 0, students: 0, satisfaction: 98 };
  }
}

export async function adminFetch(url: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const { cookies } = await import("next/headers");
  const cookieString = cookies().toString();
  const res = await fetch(`${baseUrl}${url}`, {
    headers: cookieString ? { Cookie: cookieString } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
