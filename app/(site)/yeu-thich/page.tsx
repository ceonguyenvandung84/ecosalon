"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountedPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function WishlistPage() {
  const [items, setItems] = useState<Array<{ id: string; productId: string; product: { slug: string; image?: string; title: string; brand?: string; price: number; discountPercent?: number } }>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/wishlist").then((r) => r.json()).then((d) => setItems(d?.wishlist ?? [])).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (productId: string) => {
    try {
      await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      setItems((prev) => (prev ?? []).filter((x) => x?.productId !== productId));
      toast.success("Đã bỏ yêu thích");
    } catch { toast.error("Đã có lỗi xảy ra"); }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Bộ sưu tập</div>
      <h1 className="font-sans text-3xl font-bold">Sản phẩm yêu thích</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (items ?? []).length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-secondary/40 py-16 text-center">
          <Heart className="mb-3 h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Chưa có sản phẩm yêu thích nào.</p>
          <Button asChild className="mt-4"><Link href="/san-pham">Khám phá sản phẩm</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {(items ?? []).map((w) => {
            const p = w?.product ?? {};
            const hasDiscount = (p?.discountPercent ?? 0) > 0;
            const finalPrice = hasDiscount ? discountedPrice(p?.price ?? 0, p?.discountPercent ?? 0) : p?.price ?? 0;
            return (
              <div key={w?.id} className="group overflow-hidden rounded-xl bg-card shadow-sm transition hover:shadow-lg">
                <Link href={`/san-pham/${p?.slug}`} className="relative block aspect-square bg-muted">
                  <Image src={p?.image || "/images/product-1.jpg"} alt={p?.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                </Link>
                <div className="p-4">
                  {p?.brand ? <Badge variant="secondary" className="mb-1">{p?.brand}</Badge> : null}
                  <Link href={`/san-pham/${p?.slug}`}><h3 className="font-medium line-clamp-2 hover:text-primary">{p?.title}</h3></Link>
                  <div className="mt-2 font-sans font-bold text-primary">{formatPrice(finalPrice)}</div>
                  <Button variant="ghost" size="sm" className="mt-2 w-full gap-2 text-destructive hover:text-destructive" onClick={() => remove(w?.productId)}>
                    <Trash2 className="h-4 w-4" /> Bỏ yêu thích
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
