"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Scissors, Sparkles, Store, GraduationCap, Loader2, Eye, MessageCircle, Pin, Lock, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

const ICONS: Record<string, React.ElementType> = {
  MessagesSquare, Scissors, Sparkles, Store, GraduationCap,
};

export default function ForumPage() {
  const [categories, setCategories] = useState<Array<{ id: string; slug: string; name: string; description?: string; icon?: string; _count?: { threads: number } }>>([]);
  const [threads, setThreads] = useState<Array<{ id: string; title: string; slug: string; isPinned?: boolean; isLocked?: boolean; replyCount: number; viewCount: number; lastReplyAt: string; category?: { name: string }; author?: { fullName: string } }>>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forum").then((r) => r.json()).then((d) => setCategories(d?.categories ?? [])).catch((e) => console.error("Failed to load forum categories", e));
  }, []);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (activeCat !== "all") sp.set("category", activeCat);
    if (q) sp.set("search", q);
    const t = setTimeout(() => {
      fetch(`/api/forum/threads?${sp.toString()}`)
        .then((r) => r.json())
        .then((d) => setThreads(d?.threads ?? []))
        .catch(() => setThreads([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [activeCat, q, setLoading, setThreads]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Diễn đàn" }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Cộng đồng</div>
          <h1 className="font-sans text-3xl font-bold">Diễn đàn</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Nơi kết nối, trao đổi kinh nghiệm và học hỏi cùng cộng đồng nghề tóc &amp; làm đẹp.</p>
        </div>
        <Button asChild size="lg"><Link href="/dien-dan/tao-chu-de"><Plus className="mr-2 h-5 w-5" /> Tạo chủ đề</Link></Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const Icon = ICONS[c.icon ?? ""] ?? MessagesSquare;
          return (
            <button key={c.id} onClick={() => setActiveCat(activeCat === c.slug ? "all" : c.slug)} className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition", activeCat === c.slug ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="font-semibold">{c.name}</div>
                <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                <span className="mt-1 inline-block text-xs text-primary">{formatNumber(c._count?.threads)} chủ đề</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-sans text-xl font-bold">{activeCat === "all" ? "Tất cả chủ đề" : categories.find((c) => c.slug === activeCat)?.name}</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder="Tìm chủ đề..." />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : threads.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Chưa có chủ đề nào. Hãy tạo chủ đề đầu tiên!</div>
        ) : (
          <ul className="divide-y divide-border">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/dien-dan/${t.slug}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-secondary/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {t.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      {t.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      <span className="truncate font-semibold hover:text-primary">{t.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <Badge variant="secondary">{t.category?.name}</Badge>
                      <span>bởi {t.author?.fullName}</span>
                      <span>{formatDate(t.lastReplyAt)}</span>
                    </div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-sm text-muted-foreground sm:flex">
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{formatNumber(t.replyCount)}</span>
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(t.viewCount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
