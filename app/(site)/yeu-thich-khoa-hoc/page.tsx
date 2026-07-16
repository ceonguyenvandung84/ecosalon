"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";
import { toast } from "sonner";

export default function CourseWishlistPage() {
  const [items, setItems] = useState<Array<{ id: string; courseId: string; course: { slug: string; thumbnail?: string; title: string; category?: string; instructorName?: string; price: number; discountPrice?: number } }>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/course-wishlist").then((r) => r.json()).then((d) => setItems(d?.wishlist ?? [])).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (courseId: string) => {
    try {
      await fetch("/api/course-wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
      setItems((prev) => (prev ?? []).filter((x) => x?.courseId !== courseId));
      toast.success("Đã bỏ yêu thích");
    } catch { toast.error("Đã có lỗi xảy ra"); }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Khóa học yêu thích" }]} />
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Bộ sưu tập</div>
      <h1 className="font-sans text-3xl font-bold">Khóa học yêu thích</h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (items ?? []).length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-secondary/40 py-16 text-center">
          <Heart className="mb-3 h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Chưa có khóa học yêu thích nào.</p>
          <Button asChild className="mt-4"><Link href="/khoa-hoc">Khám phá khóa học</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {(items ?? []).map((w) => {
            const c = w?.course ?? {};
            const hasDiscount = !!c?.discountPrice && c.discountPrice < c.price;
            return (
              <div key={w?.id} className="group overflow-hidden rounded-xl bg-card shadow-sm transition hover:shadow-lg">
                <Link href={`/khoa-hoc/${c?.slug}`} className="relative block aspect-[4/3] bg-muted">
                  <Image src={c?.thumbnail || "/images/course-1.jpg"} alt={c?.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                </Link>
                <div className="p-4">
                  {c?.category ? <Badge variant="secondary" className="mb-1">{c?.category}</Badge> : null}
                  <Link href={`/khoa-hoc/${c?.slug}`}><h3 className="font-medium line-clamp-2 hover:text-primary">{c?.title}</h3></Link>
                  <div className="mt-1 text-xs text-muted-foreground">{c?.instructorName}</div>
                  <div className="mt-2 font-sans font-bold text-primary">{formatPrice(hasDiscount ? c?.discountPrice : c?.price)}</div>
                  <Button variant="ghost" size="sm" className="mt-2 w-full gap-2 text-destructive hover:text-destructive" onClick={() => remove(w?.courseId)}>
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