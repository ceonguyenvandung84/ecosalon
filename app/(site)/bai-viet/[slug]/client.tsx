"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Eye, Calendar, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { contentToParagraphs } from "@/lib/community";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";

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

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: session } = useSession();
  const [post, setPost] = useState<{
    id: string; title: string; slug: string; content: string; coverImage?: string;
    publishedAt: string; viewCount: number; category?: { name: string };
    author?: { avatarPath?: string; fullName: string };
    comments?: Array<{ id: string; content: string; createdAt: string; user?: { avatarPath?: string; fullName: string } }>;
  } | null>(null);
  const [related, setRelated] = useState<Array<{ id: string; title: string; slug: string; coverImage?: string; publishedAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch(`/api/blog/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setPost(d?.post ?? null);
        setRelated(d?.related ?? []);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (slug) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Lỗi");
      setPost((prev) => ({ ...prev!, comments: [d.comment, ...(prev?.comments ?? [])] }));
      setComment("");
      toast.success("Đã gửi bình luận");
    } catch {
      toast.error("Không thể gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!post) return (
    <div className="mx-auto max-w-[800px] px-4 py-32 text-center">
      <p className="text-muted-foreground">Không tìm thấy bài viết.</p>
      <Link href="/bai-viet" className="mt-4 inline-block text-primary hover:underline">← Về trang bài viết</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
      <SiteBreadcrumbs items={[{ label: "Bài viết", href: "/bai-viet" }, { label: post?.title ?? "" }]} />

      {post.category && <Badge variant="secondary" className="mt-6">{post.category.name}</Badge>}
      <h1 className="mt-3 font-sans text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><Avatar src={post.author?.avatarPath} name={post.author?.fullName} className="h-8 w-8 text-xs" />{post.author?.fullName}</span>
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(post.publishedAt)}</span>
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(post.viewCount)} lượt xem</span>
      </div>

      {post.coverImage && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-muted">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 820px) 100vw, 820px" priority />
        </div>
      )}

      <article className="mt-8">
        {contentToParagraphs(post.content).map((para, i) => (
          <p key={i} className="mb-4 leading-relaxed text-foreground/90">{para}</p>
        ))}
      </article>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-sans text-xl font-bold">Bình luận ({post.comments?.length ?? 0})</h2>

        {session ? (
          <div className="mt-4 flex gap-3">
            <Avatar name={session.user?.name ?? undefined} className="h-10 w-10 text-sm" />
            <div className="flex-1">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Viết bình luận của bạn..." rows={3} />
              <div className="mt-2 flex justify-end">
                <Button onClick={submitComment} disabled={submitting || !comment.trim()}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Gửi bình luận
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            Vui lòng <Link href="/dang-nhap" className="font-semibold text-primary hover:underline">đăng nhập</Link> để bình luận.
          </div>
        )}

        <div className="mt-6 space-y-5">
          {(post.comments ?? []).map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar src={c.user?.avatarPath} name={c.user?.fullName} className="h-10 w-10 text-sm" />
              <div className="flex-1 rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{c.user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.content}</p>
              </div>
            </div>
          ))}
          {(post.comments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-sans text-xl font-bold">Bài viết liên quan</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/bai-viet/${r.slug}`} className="group overflow-hidden rounded-xl bg-card shadow-sm transition hover:shadow-md">
                <div className="relative aspect-video bg-muted">
                  {r.coverImage ? <Image src={r.coverImage} alt={r.title} fill className="object-cover transition group-hover:scale-105" sizes="33vw" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Không có ảnh</div>}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">{r.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
