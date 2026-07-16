"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

export default function ProductsPage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params?.get("q") ?? "");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("popular");
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string; slug: string; shortDesc: string; image: string; price: number; discountPercent: number; category: string; brand: string; rating: number; reviewsCount: number; soldCount: number }>>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetch("/api/categories?type=PRODUCT").then((r) => r.json()).then((d) => setCategories(d?.categories ?? [])).catch((e) => console.error("Failed to load categories", e));
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(d?.brands ?? [])).catch((e) => console.error("Failed to load brands", e));
    fetch("/api/wishlist/ids").then((r) => r.json()).then((d) => setFavIds(d?.ids ?? [])).catch((e) => console.error("Failed to load wishlist", e));
  }, []);

  useEffect(() => { setPage(1); }, [q, category, brand, sort, setPage]);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category !== "all") sp.set("category", category);
    if (brand !== "all") sp.set("brand", brand);
    if (sort) sp.set("sort", sort);
    sp.set("page", String(page));
    sp.set("limit", String(pageSize));
    const t = setTimeout(() => {
      fetch(`/api/products?${sp.toString()}`).then((r) => r.json()).then((d) => { setProducts(d?.products ?? []); setTotal(d?.total ?? 0); setTotalPages(d?.totalPages ?? 0); }).catch(() => setProducts([])).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, category, brand, sort, page, setLoading, setProducts, setTotal, setTotalPages]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Sản phẩm" }]} />
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Mỹ phẩm</div>
      <h1 className="font-sans text-3xl font-bold">Sản phẩm</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Bộ sản phẩm chăm sóc và tạo kiểu tóc cao cấp cho salon.</p>

      <div className="mt-8 flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" placeholder="Tìm kiếm sản phẩm..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Danh mục" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {(categories ?? []).map((c) => <SelectItem key={c?.id} value={c?.slug}>{c?.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Thương hiệu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thương hiệu</SelectItem>
              {(brands ?? []).map((b) => <SelectItem key={b?.id} value={b?.slug}>{b?.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Bán chạy</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price-asc">Giá tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (products ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground"><SlidersHorizontal className="mb-3 h-10 w-10" />Không tìm thấy sản phẩm phù hợp.</div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(products ?? []).map((p, i) => <ProductCard key={p?.id ?? i} product={p} index={i} initialFavorite={(favIds ?? []).includes(p?.id)} />)}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Trước</Button>
              <span className="mx-2 text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
