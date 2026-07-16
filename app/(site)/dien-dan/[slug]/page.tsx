import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ForumThreadClient from "./client";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const thread = await prisma.forumThread.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  });
  if (!thread) return { title: "Không tìm thấy chủ đề | SALON HAIR SYSTEM" };
  return {
    title: `${thread.title} | SALON HAIR SYSTEM`,
    description: `Thảo luận: ${thread.title}`,
    openGraph: { title: thread.title },
  };
}

export default function ForumThreadPage() {
  return <ForumThreadClient />;
}
