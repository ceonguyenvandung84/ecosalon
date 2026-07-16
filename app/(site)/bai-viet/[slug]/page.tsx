import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import BlogPostClient from "./client";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, coverImage: true },
  });
  if (!post) return { title: "Không tìm thấy bài viết | SALON HAIR SYSTEM", description: "Bài viết không tồn tại hoặc đã bị xóa." };
  return {
    title: `${post.title} | SALON HAIR SYSTEM`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  };
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
