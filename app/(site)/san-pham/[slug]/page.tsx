import { prisma } from "@/lib/db";
import { resolveImageUrl } from "@/lib/s3";
import type { Metadata } from "next";
import ProductDetailClient from "./client";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { title: true, shortDesc: true, images: true },
  });
  if (!product) return { title: "Không tìm thấy sản phẩm | SALON HAIR SYSTEM" };
  return {
    title: `${product.title} | SALON HAIR SYSTEM`,
    description: product.shortDesc,
    openGraph: {
      title: product.title,
      description: product.shortDesc,
      images: product.images?.[0] ? [resolveImageUrl(product.images[0])] : [],
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
