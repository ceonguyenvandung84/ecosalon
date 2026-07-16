"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Eye, MessageCircle, Pin, Lock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import { contentToParagraphs } from "@/lib/community";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

function UserBadge({ role, certificateCount }: { role?: string; certificateCount?: number }) {
  return (
    <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
      {role === "ADMIN" && <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Admin</Badge>}
      {role === "INSTRUCTOR" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Giảng viên</Badge>}
      {certificateCount != null && certificateCount > 0 && <Badge variant="outline" className="border-green-300 text-green-700 text-[10px] px-1.5 py-0 h-4">Đã tốt nghiệp</Badge>}
    </span>
  );
}

function Avatar({ src, name, className }: { src?: string; name?: string; className?: string }) {
  if (src) {
    return (
      <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-muted", className)}>
        <Image src={src} alt={name ?? ""} fill className="object-cover" sizes="48px" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary", className)}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

export default function ThreadDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: session } = useSession();
  const [thread, setThread] = useState<{
    id: string; title: string; slug: string; content: string; createdAt: string;
    viewCount: number; replyCount: number; isPinned?: boolean; isLocked?: boolean;
    category?: { name: string };
    author?: { avatarPath?: string; fullName: string; role?: string; certificateCount?: number };
    replies?: Array<{ id: string; content: string; createdAt: string; author?: { avatarPath?: string; fullName: string; role?: string; certificateCount?: number } }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch(`/api/forum/threads/${slug}`)
      .then((r) => r.json())
      .then((d) => setThread(d?.thread ?? null))
      .catch(() => setThread(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (slug) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/threads/${slug}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Lỗi");
      setThread((prev) => ({ ...prev!, replies: [...(prev?.replies ?? []), d.reply], replyCount: (prev?.replyCount ?? 0) + 1 }));
      setReply("");
      toast.success("Đã gửi trả lời");
    } catch {
      toast.error("Không thể gửi trả lời");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!thread) return (
    <div className="mx-auto max-w-[800px] px-4 py-32 text-center">
      <p className="text-muted-foreground">Không tìm thấy chủ đề.</p>
      <Link href="/dien-dan" className="mt-4 inline-block text-primary hover:underline">← Về diễn đàn</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Diễn đàn", href: "/dien-dan" }, { label: thread?.title ?? "" }]} />

      <div className="mt-6 flex items-center gap-2">
        {thread.isPinned && <Pin className="h-5 w-5 text-primary" />}
        {thread.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
        <Badge variant="secondary">{thread.category?.name}</Badge>
      </div>
      <h1 className="mt-3 font-sans text-2xl font-bold leading-tight md:text-3xl">{thread.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{formatNumber(thread.replyCount)} trả lời</span>
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(thread.viewCount)} lượt xem</span>
      </div>

      {/* Original post */}
      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <Avatar src={thread.author?.avatarPath} name={thread.author?.fullName} className="h-11 w-11 text-base" />
          <div>
            <div className="font-semibold">{thread.author?.fullName}<UserBadge role={thread.author?.role} certificateCount={thread.author?.certificateCount} /></div>
            <div className="text-xs text-muted-foreground">{formatDate(thread.createdAt)} · Người tạo chủ đề</div>
          </div>
        </div>
        <div className="mt-4">
          {contentToParagraphs(thread.content).map((p, i) => <p key={i} className="mb-3 whitespace-pre-wrap leading-relaxed text-foreground/90">{p}</p>)}
        </div>
      </div>

      {/* Replies */}
      <h2 className="mt-10 font-sans text-lg font-bold">Trả lời ({thread.replies?.length ?? 0})</h2>
      <div className="mt-4 space-y-4">
        {(thread.replies ?? []).map((r) => (
          <div key={r.id} className="flex gap-3">
            <Avatar src={r.author?.avatarPath} name={r.author?.fullName} className="h-10 w-10 text-sm" />
            <div className="flex-1 rounded-xl bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.author?.fullName}<UserBadge role={r.author?.role} certificateCount={r.author?.certificateCount} /></span>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{r.content}</p>
            </div>
          </div>
        ))}
        {(thread.replies ?? []).length === 0 && <p className="text-sm text-muted-foreground">Chưa có trả lời nào.</p>}
      </div>

      {/* Reply box */}
      <div className="mt-8 border-t border-border pt-6">
        {thread.isLocked ? (
          <div className="rounded-xl bg-secondary p-4 text-center text-sm text-muted-foreground"><Lock className="mr-2 inline h-4 w-4" />Chủ đề đã bị khóa, không thể trả lời.</div>
        ) : session ? (
          <div className="flex gap-3">
            <Avatar name={session.user?.name ?? undefined} className="h-10 w-10 text-sm" />
            <div className="flex-1">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Viết câu trả lời của bạn..." rows={4} />
              <div className="mt-2 flex justify-end">
                <Button onClick={submitReply} disabled={submitting || !reply.trim()}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Gửi trả lời
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            Vui lòng <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">đăng nhập</Link> để trả lời.
          </div>
        )}
      </div>
    </div>
  );
}
