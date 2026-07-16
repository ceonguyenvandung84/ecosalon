"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Loader2, ArrowLeft, PlayCircle, Brain, File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { LessonAttachment } from "@/lib/types";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  videoProvider: "YOUTUBE" | "VIMEO" | "S3" | "OTHER";
  thumbnailPath: string | null;
  durationMin: number;
  order: number;
  isPreview: boolean;
  canView: boolean;
  completed: boolean;
  attachments?: LessonAttachment[] | null;
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;
  const lessonSlug = params.lessonSlug as string;

  const [lesson, setLesson] = useState<Lesson & { course?: { title: string }; quiz?: { id: string; title: string; isPublished: boolean } } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lessonsRes = await fetch(`/api/courses/${slug}/lessons`);
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        const allLessons: Lesson[] = data?.lessons ?? [];
        setLessons(allLessons);
        const found = allLessons.find((l) => l.slug === lessonSlug);
        if (found) {
          const detailRes = await fetch(`/api/lessons/${found.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setLesson(detail);
            setCompleted(detail.completed ?? false);
          }
        } else {
          setLesson(null);
        }
      }
    } catch { setLesson(null); }
    finally { setLoading(false); }
  }, [slug, lessonSlug]);

  useEffect(() => { if (slug && lessonSlug) load(); }, [slug, lessonSlug, load, setLoading, setLessons, setLesson, setCompleted]);

  const toggleComplete = async () => {
    if (!session?.user) { router.push("/dang-nhap"); return; }
    if (!lesson?.id) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setCompleted(data.completed);
        toast.success(data.completed ? "Đã đánh dấu hoàn thành" : "Đã bỏ đánh dấu");
        load();
      }
    } catch { toast.error("Lỗi"); }
    finally { setToggling(false); }
  };

  const sortedLessons = lessons.filter((l) => l.canView).sort((a, b) => a.order - b.order);
  const currentIndex = sortedLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;
  const completedCount = sortedLessons.filter((l) => l.completed).length;
  const progress = sortedLessons.length > 0 ? Math.round((completedCount / sortedLessons.length) * 100) : 0;

  const getVideoEmbedUrl = () => {
    if (!lesson?.videoUrl) return null;
    if (lesson.videoProvider === "YOUTUBE") {
      const match = lesson.videoUrl.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
      );
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return lesson.videoUrl;
  };

  const embedUrl = getVideoEmbedUrl();

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <p>Không tìm thấy bài học</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/khoa-hoc/${slug}`)}>
          Quay lại khóa học
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col lg:flex-row">
      <div className="flex-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Link href={`/khoa-hoc/${slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {lesson?.course?.title}
          </Link>
        </div>

        {embedUrl ? (
          <div className="relative aspect-video bg-black">
            {lesson.videoProvider === "YOUTUBE" ? (
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video className="h-full w-full" controls src={embedUrl} />
            )}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted">
            <p className="text-muted-foreground">Video chưa được cập nhật</p>
          </div>
        )}

        <div className="p-4 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-sans text-xl font-bold lg:text-2xl">{lesson?.title}</h1>
              {lesson?.description && (
                <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>
              )}
            </div>
            <Button
              variant={completed ? "secondary" : "default"}
              size="sm"
              className="gap-2 shrink-0"
              onClick={toggleComplete}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {completed ? "Hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>
          </div>

          {lesson?.content && (
            <div className="mt-6 prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {(lesson?.attachments?.length ?? 0) > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-sm">Tài liệu đính kèm</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {lesson?.attachments?.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-secondary/50"
                  >
                    <File className="h-5 w-5 shrink-0 text-primary" />
                    <span className="flex-1 truncate">{att.fileName}</span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {lesson?.quiz && lesson.quiz.isPublished && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Bài kiểm tra: {lesson.quiz.title}</p>
                    <p className="text-xs text-muted-foreground">Kiểm tra kiến thức sau bài học này</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/quiz/${lesson.quiz.id}`}>Làm quiz</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <div>
              {prevLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push(`/khoa-hoc/${slug}/bai-hoc/${prevLesson.slug}`)}
                >
                  <ChevronLeft className="h-4 w-4" /> Bài trước
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <ChevronLeft className="h-4 w-4" /> Bài trước
                </Button>
              )}
            </div>
            <div>
              {nextLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push(`/khoa-hoc/${slug}/bai-hoc/${nextLesson.slug}`)}
                >
                  Bài tiếp theo <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  Bài tiếp theo <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="w-full border-border bg-card lg:w-80 lg:border-l">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Nội dung khóa học</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span>{completedCount}/{sortedLessons.length}</span>
          </div>
        </div>
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
          {sortedLessons.map((l) => {
            const isActive = l.slug === lessonSlug;
            return (
              <button
                key={l.id}
                onClick={() => router.push(`/khoa-hoc/${slug}/bai-hoc/${l.slug}`)}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/50 ${
                  isActive ? "bg-primary/10 font-medium" : ""
                }`}
              >
                {l.completed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                )}
                <span className="flex-1 truncate">{l.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{l.durationMin}ph</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
