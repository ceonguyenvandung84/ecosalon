"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Heart, Loader2, Package, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/site/rating-stars";
import { ReviewForm } from "@/components/site/review-form";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";
import { formatPrice, formatNumber, discountedPrice, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<{
    id: string; title: string; slug: string; shortDesc?: string; description?: string;
    price: number; discountPercent?: number; rating?: number; reviewsCount?: number;
    soldCount?: number; stock?: number; sku?: string; brand?: string;
    images?: string[]; specifications?: Record<string, string>;
    reviews?: Array<{ id: string; userName?: string; rating: number; comment?: string; createdAt: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [fav, setFav] = useState(false);
  const [qty, setQty] = useState(1);

  const load = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`).then((r) => r.json()).then((d) => setProduct(d?.product ?? null)).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load, setLoading]);

  useEffect(() => {
    if (product?.id) fetch("/api/wishlist/ids").then((r) => r.json()).then((d) => setFav((d?.ids ?? []).includes(product?.id))).catch((e) => console.error("Failed to load wishlist", e));
  }, [product?.id, setFav]);

  const toggleFav = async () => {
    if (!session?.user) { router.push(`/dang-nhap?callbackUrl=/san-pham/${slug}`); return; }
    try {
      const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product?.id }) });
      const d = await res.json().catch(() => ({}));
      setFav(!!d?.favorited);
      toast.success(d?.favorited ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
    } catch { toast.error("Đã có lỗi xảy ra"); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="py-32 text-center text-muted-foreground">Không tìm thấy sản phẩm.</div>;

  const hasDiscount = (product?.discountPercent ?? 0) > 0;
  const finalPrice = hasDiscount ? discountedPrice(product?.price ?? 0, product?.discountPercent ?? 0) : product?.price ?? 0;
  const images = (product?.images ?? []).length ? product.images : ["/images/product-1.jpg"];
  const specs = product?.specifications ?? {};

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Sản phẩm", href: "/san-pham" }, { label: product?.title ?? "" }]} />
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-md">
            <Image src={images?.[activeImg] || images?.[0] || "/images/product-1.jpg"} alt={product?.title ?? ""} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            {hasDiscount ? <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">-{product?.discountPercent}%</Badge> : null}
          </div>
          {(images ?? []).length > 1 ? (
            <div className="mt-4 flex gap-3">
              {(images ?? []).map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} className={cn("relative h-20 w-20 overflow-hidden rounded-lg bg-muted ring-2 transition", activeImg === i ? "ring-primary" : "ring-transparent")}>
                  <Image src={img} alt={`Ảnh ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          {product?.brand ? <Badge variant="secondary" className="mb-2">{product?.brand}</Badge> : null}
          <h1 className="font-sans text-3xl font-bold">{product?.title}</h1>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><RatingStars rating={product?.rating ?? 0} size={16} /> {product?.rating} ({formatNumber(product?.reviewsCount)})</span>
            <span>Đã bán {formatNumber(product?.soldCount)}</span>
          </div>
          <div className="mt-5 flex items-end gap-3">
            <span className="font-sans text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
            {hasDiscount ? <span className="mb-1 text-muted-foreground line-through">{formatPrice(product?.price)}</span> : null}
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">{product?.shortDesc}</p>
          <div className="mt-4 text-sm">
            <span className={cn("font-medium", (product?.stock ?? 0) > 0 ? "text-primary" : "text-destructive")}>{(product?.stock ?? 0) > 0 ? `Còn hàng (${product?.stock})` : "Hết hàng"}</span>
            {product?.sku ? <span className="ml-3 text-muted-foreground">SKU: {product?.sku}</span> : null}
          </div>
          {(product?.stock ?? 0) > 0 ? (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Số lượng</span>
              <div className="flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Giảm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product?.stock ?? 1, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
                  disabled={qty >= (product?.stock ?? 1)}
                  aria-label="Tăng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex gap-3">
            <AddToCartButton
              productId={product!.id}
              quantity={qty}
              disabled={(product?.stock ?? 0) <= 0}
              className="flex-1"
              redirectTo={`/san-pham/${slug}`}
              label={(product?.stock ?? 0) > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
            />
            <Button size="lg" variant="outline" onClick={toggleFav} aria-label="Yêu thích">
              <Heart className={cn("h-5 w-5", fav ? "fill-rose-500 text-rose-500" : "")} />
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <div className="rounded-lg bg-secondary/40 p-3"><Truck className="mx-auto mb-1 h-5 w-5 text-primary" /> Giao hàng toàn quốc</div>
            <div className="rounded-lg bg-secondary/40 p-3"><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-primary" /> Chính hãng 100%</div>
            <div className="rounded-lg bg-secondary/40 p-3"><Package className="mx-auto mb-1 h-5 w-5 text-primary" /> Đổi trả 7 ngày</div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-sans text-2xl font-bold">Mô tả sản phẩm</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product?.description}</p>
          {Object.keys(specs ?? {}).length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold">Thông số</h3>
              <div className="overflow-hidden rounded-xl bg-card shadow-sm">
                {Object.entries(specs ?? {}).map(([k, v], i) => (
                  <div key={i} className="flex justify-between border-b border-border/50 px-4 py-2.5 text-sm last:border-0">
                    <span className="text-muted-foreground">{k}</span><span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="mb-3 font-sans text-2xl font-bold">Đánh giá ({formatNumber(product?.reviewsCount)})</h2>
          <div className="mb-4">
            <ReviewForm productId={product?.id} onSuccess={() => load()} />
          </div>
          <div className="space-y-4">
            {(product?.reviews ?? []).length === 0 ? <p className="text-muted-foreground">Chưa có đánh giá nào.</p> : (product?.reviews ?? []).map((r) => (
              <div key={r?.id} className="rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r?.userName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(r?.createdAt)}</span>
                </div>
                <RatingStars rating={r?.rating ?? 0} size={14} />
                <p className="mt-2 text-sm text-muted-foreground">{r?.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
