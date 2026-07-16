"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, Eye, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

export default function BlogListPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string; _count?: { posts: number } }>>([]);
  const [posts, setPosts] = useState<Array<{ id: string; title: string; slug: string; coverImage?: string; excerpt?: string; publishedAt: string; viewCount: number; isFeatured?: boolean; category?: { name: string }; _count?: { comments: number } }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 12;

  useEffect(() => { setPage(1); }, [q, category, setPage]);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("search", q);
    if (category !== "all") sp.set("category", category);
    sp.set("page", String(page));
    sp.set("limit", String(pageSize));
    const t = setTimeout(() => {
      fetch(`/api/blog?${sp.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          setPosts(d?.posts ?? []);
          setCategories(d?.categories ?? []);
          setTotal(d?.total ?? 0);
          setTotalPages(d?.totalPages ?? 0);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, category, page, setLoading, setPosts, setCategories, setTotal, setTotalPages]);

  const featured = posts.find((p) => p.isFeatured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Bài viết & Kinh nghiệm" }]} />
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Cộng đồng</div>
      <h1 className="font-sans text-3xl font-bold">Bài viết &amp; Kinh nghiệm</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Kiến thức, xu hướng và bí quyết nghề tóc – làm đẹp từ đội ngũ chuyên gia.</p>

      <div className="mt-8 flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" placeholder="Tìm kiếm bài viết..." />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setCategory("all")} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition", category === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70")}>Tất cả</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.slug)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition", category === c.slug ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70")}>{c.name} ({c._count?.posts ?? 0})</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">Chưa có bài viết nào.</div>
      ) : (
        <>
          {featured && (
            <Link href={`/bai-viet/${featured.slug}`} className="group mt-8 grid gap-6 overflow-hidden rounded-2xl bg-card shadow-sm transition hover:shadow-lg md:grid-cols-2">
              <div className="relative aspect-video bg-muted md:aspect-auto md:h-full">
                {featured.coverImage ? (
                  <Image src={featured.coverImage} alt={featured.title} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">Không có ảnh</div>
                )}
                <Badge className="absolute left-4 top-4">Nổi bật</Badge>
              </div>
              <div className="flex flex-col justify-center p-6 md:p-8">
                {featured.category && <Badge variant="secondary" className="mb-3 w-fit">{featured.category.name}</Badge>}
                <h2 className="font-sans text-2xl font-bold leading-snug group-hover:text-primary">{featured.title}</h2>
                <p className="mt-3 line-clamp-3 text-muted-foreground">{featured.excerpt}</p>
                <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(featured.publishedAt)}</span>
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(featured.viewCount)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{formatNumber(featured._count?.comments)}</span>
                </div>
              </div>
            </Link>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition hover:shadow-lg">
                <div className="relative aspect-video bg-muted">
                  {p.coverImage ? (
                    <Image src={p.coverImage} alt={p.title} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Không có ảnh</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {p.category && <Badge variant="secondary" className="mb-2 w-fit">{p.category.name}</Badge>}
                  <h3 className="font-sans text-lg font-bold leading-snug group-hover:text-primary">{p.title}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(p.publishedAt)}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatNumber(p.viewCount)}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatNumber(p._count?.comments)}</span>
                  </div>
                </div>
              </Link>
            ))}
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
