import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import type { Metadata } from "next";
import CourseDetailClient from "./client";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { title: true, shortDesc: true, thumbnailPath: true },
  });
  if (!course) return { title: "Không tìm thấy khóa học | SALON HAIR SYSTEM" };
  return {
    title: `${course.title} | SALON HAIR SYSTEM`,
    description: course.shortDesc,
    openGraph: {
      title: course.title,
      description: course.shortDesc,
      images: course.thumbnailPath ? [resolveImageUrl(course.thumbnailPath)] : [],
    },
  };
}

export default function CourseDetailPage() {
  return <CourseDetailClient />;
}
