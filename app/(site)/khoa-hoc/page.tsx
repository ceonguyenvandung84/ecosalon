"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { CourseCard } from "@/components/site/course-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

export default function CoursesPage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params?.get("q") ?? "");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("popular");
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string; slug: string; shortDesc: string; thumbnail: string; price: number; discountPrice: number | null; level: string; durationHours: number; instructorName: string; category: string; rating: number; reviewsCount: number; lessonsCount: number; studentsCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [favIds, setFavIds] = useState<string[]>([]);
  const pageSize = 12;

  useEffect(() => {
    fetch("/api/categories?type=COURSE").then((r) => r.json()).then((d) => setCategories(d?.categories ?? [])).catch((e) => console.error("Failed to load categories", e));
  }, []);

  useEffect(() => { fetch("/api/course-wishlist/ids").then((r) => r.json()).then((d) => setFavIds(d?.ids ?? [])).catch((e) => console.error("Failed to load wishlist", e)); }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [q, category, level, sort, setPage]);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category !== "all") sp.set("category", category);
    if (level !== "all") sp.set("level", level);
    if (sort) sp.set("sort", sort);
    sp.set("page", String(page));
    sp.set("limit", String(pageSize));
    const t = setTimeout(() => {
      fetch(`/api/courses?${sp.toString()}`).then((r) => r.json()).then((d) => { setCourses(d?.courses ?? []); setTotal(d?.total ?? 0); setTotalPages(d?.totalPages ?? 0); }).catch(() => setCourses([])).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, category, level, sort, page, setLoading, setCourses, setTotal, setTotalPages]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Khóa học" }]} />
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Đào tạo</div>
      <h1 className="font-sans text-3xl font-bold">Khóa học</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Khám phá các khóa học làm tóc chuyên nghiệp từ cơ bản đến nâng cao.</p>

      <div className="mt-8 flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" placeholder="Tìm kiếm khóa học..." />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Danh mục" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {(categories ?? []).map((c) => <SelectItem key={c?.id} value={c?.slug}>{c?.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Cấp độ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi cấp độ</SelectItem>
              <SelectItem value="BEGINNER">Cơ bản</SelectItem>
              <SelectItem value="INTERMEDIATE">Trung cấp</SelectItem>
              <SelectItem value="ADVANCED">Nâng cao</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Phổ biến</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price-asc">Giá tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (courses ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground"><SlidersHorizontal className="mb-3 h-10 w-10" />Không tìm thấy khóa học phù hợp.</div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(courses ?? []).map((c, i) => <CourseCard key={c?.id ?? i} course={c} index={i} initialFavorite={favIds.includes(c?.id)} onToggle={(id, fav) => { if (fav) setFavIds((prev) => [...prev, id]); else setFavIds((prev) => prev.filter((x) => x !== id)); }} />)}
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
