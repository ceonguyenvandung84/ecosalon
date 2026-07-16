import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://salonhair.vn";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/khoa-hoc`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/san-pham`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/bai-viet`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/dien-dan`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/dang-nhap`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/dang-ky`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const [courses, products, posts, threads] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.forumThread.findMany({
      where: { isHidden: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...courses.map((c) => ({
      url: `${baseUrl}/khoa-hoc/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${baseUrl}/san-pham/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${baseUrl}/bai-viet/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...threads.map((t) => ({
      url: `${baseUrl}/dien-dan/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}