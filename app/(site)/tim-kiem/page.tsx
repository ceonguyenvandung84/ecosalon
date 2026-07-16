"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, BookOpen, ShoppingBag, FileText, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

interface CourseResult { id: string; title: string; slug: string; shortDesc?: string | null; thumbnailPath?: string | null; price: number; discountPrice?: number | null; }
interface ProductResult { id: string; title: string; slug: string; shortDesc?: string | null; images?: string[] | null; price: number; discountPercent?: number | null; }
interface PostResult { id: string; title: string; slug: string; excerpt?: string | null; coverImage?: string | null; }
interface ThreadResult { id: string; title: string; slug: string; viewCount?: number; replyCount?: number; category?: { name: string } | null; }

interface SearchResults {
  courses: CourseResult[];
  products: ProductResult[];
  posts: PostResult[];
  threads: ThreadResult[];
}

function formatPrice(p: number, dp?: number | null) {
  if (dp && dp > 0) return <span className="text-destructive text-sm line-through mr-1">{formatNumber(p)}đ</span>;
  return <span>{formatNumber(p)}đ</span>;
}

function CourseResultCard({ c }: { c: CourseResult }) {
  return (
    <Link href={`/khoa-hoc/${c.slug}`} className="group">
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {c.thumbnailPath ? (
            <Image src={c.thumbnailPath} alt={c.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <BookOpen className="h-8 w-8 text-primary/30" />
            </div>
          )}
          {c.discountPrice && c.discountPrice < c.price && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
              -{Math.round((1 - c.discountPrice / c.price) * 100)}%
            </Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{c.title}</h3>
          {c.shortDesc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.shortDesc}</p>}
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm font-semibold text-primary">{formatNumber(c.discountPrice ?? c.price)}đ</span>
            {c.discountPrice && c.discountPrice < c.price && formatPrice(c.price, 1)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductResultCard({ p }: { p: ProductResult }) {
  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
  return (
    <Link href={`/san-pham/${p.slug}`} className="group">
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {img ? (
            <Image src={img} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <ShoppingBag className="h-8 w-8 text-primary/30" />
            </div>
          )}
          {p.discountPercent && p.discountPercent > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">-{p.discountPercent}%</Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
          {p.shortDesc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.shortDesc}</p>}
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm font-semibold text-primary">{formatNumber(p.price)}đ</span>
            {p.discountPercent && <span className="text-xs text-muted-foreground line-through">{Math.round(p.price * (1 + p.discountPercent / 100))}đ</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResults>({ courses: [], products: [], posts: [], threads: [] });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  const doSearch = useCallback((term: string) => {
    if (!term) { setResults({ courses: [], products: [], posts: [], threads: [] }); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(term)}`)
      .then((r) => r.json())
      .then((d) => setResults(d || { courses: [], products: [], posts: [], threads: [] }))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { doSearch(q); }, [q, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchInput.trim();
    if (term) router.push(`/tim-kiem?q=${encodeURIComponent(term)}`);
  };

  const total = results.courses.length + results.products.length + results.posts.length + results.threads.length;

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Tìm kiếm</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm khóa học, sản phẩm, bài viết, diễn đàn..."
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        {q && !loading && (
          <p className="text-muted-foreground mt-2 text-sm">Tìm thấy {formatNumber(total)} kết quả cho "{q}"</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !q ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nhập từ khóa để tìm kiếm</p>
        </div>
      ) : total === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Không tìm thấy kết quả nào cho "{q}"</p>
          <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-10">
          {results.courses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Khóa học</h2>
                <Badge variant="secondary">{results.courses.length}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.courses.map((c) => <CourseResultCard key={c.id} c={c} />)}
              </div>
            </section>
          )}

          {results.products.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Sản phẩm</h2>
                <Badge variant="secondary">{results.products.length}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.products.map((p) => <ProductResultCard key={p.id} p={p} />)}
              </div>
            </section>
          )}

          {results.posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Bài viết</h2>
                <Badge variant="secondary">{results.posts.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.posts.map((p) => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group">
                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {p.coverImage && (
                        <div className="aspect-video bg-muted relative">
                          <Image src={p.coverImage} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                        {p.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.threads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Diễn đàn</h2>
                <Badge variant="secondary">{results.threads.length}</Badge>
              </div>
              <div className="space-y-2">
                {results.threads.map((t) => (
                  <Link key={t.id} href={`/dien-dan/${t.slug}`} className="block">
                    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{t.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {t.category && <span>{t.category.name}</span>}
                          {t.viewCount !== undefined && <span>{formatNumber(t.viewCount)} lượt xem</span>}
                          {t.replyCount !== undefined && <span>{formatNumber(t.replyCount)} trả lời</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}