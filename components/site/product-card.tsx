"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RatingStars } from "./rating-stars";
import { useCart } from "./cart-provider";
import { formatPrice, discountedPrice, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  image: string;
  price: number;
  discountPercent: number;
  category: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  soldCount: number;
}

export function ProductCard({
  product,
  index = 0,
  initialFavorite = false,
  onToggle,
}: {
  product: ProductCardData;
  index?: number;
  initialFavorite?: boolean;
  onToggle?: (id: string, fav: boolean) => void;
}) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { addToCart } = useCart();
  const [fav, setFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để mua hàng.");
      router.push("/dang-nhap");
      return;
    }
    if (adding) return;
    setAdding(true);
    const result = await addToCart(product?.id, 1);
    setAdding(false);
    if (result === true) toast.success("Đã thêm vào giỏ hàng");
    else toast.error(result);
  }
  const hasDiscount = (product?.discountPercent ?? 0) > 0;
  const finalPrice = discountedPrice(product?.price ?? 0, product?.discountPercent ?? 0);

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
      router.push("/dang-nhap");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFav(!!data?.inWishlist);
        onToggle?.(product?.id, !!data?.inWishlist);
        toast.success(data?.inWishlist ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
      }
    } catch {
      toast.error("Thao tác thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${(index % 4) * 60}ms` }}
    >
      <Link
        href={`/san-pham/${product?.slug ?? ""}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product?.image ? (
            <Image
              src={product.image}
              alt={product?.title ?? "Sản phẩm"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          ) : null}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute left-3 top-3 shadow-sm">
              -{product?.discountPercent}%
            </Badge>
          )}
          <button
            type="button"
            onClick={toggleFav}
            aria-label="Yêu thích"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
          >
            <Heart className={cn("h-4.5 w-4.5", fav ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
          </button>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">{product?.brand || product?.category}</p>
          <h3 className="line-clamp-2 font-sans text-sm font-bold leading-snug text-foreground">{product?.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={product?.rating ?? 0} size={12} />
            <span className="text-xs text-muted-foreground">Đã bán {product?.soldCount ?? 0}</span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="flex flex-col">
              <span className="font-sans text-base font-extrabold text-primary">{formatPrice(finalPrice)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(product?.price)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Thêm vào giỏ hàng"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
              disabled={adding}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
