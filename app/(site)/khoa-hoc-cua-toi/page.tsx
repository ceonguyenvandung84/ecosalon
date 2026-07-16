"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";



export default function MyCoursesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{
    id: string; progress: number; completedLessons?: number; totalLessons?: number;
    course: { slug: string; title: string; thumbnail?: string };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/enrollments/progress")
      .then((r) => r.json())
      .then((d) => setItems(d ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const getFirstLessonSlug = async (courseSlug: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/courses/${courseSlug}/lessons`);
      const data = await res.json();
      const lessons: Array<{ slug: string; canView: boolean; completed: boolean }> = data?.lessons ?? [];
      const firstUncompleted = lessons.find((l) => !l.completed && l.canView);
      return firstUncompleted?.slug ?? lessons.find((l) => l.canView)?.slug ?? null;
    } catch { return null; }
  };

  const handleContinue = async (e: React.MouseEvent, courseSlug: string) => {
    e.preventDefault();
    const lessonSlug = await getFirstLessonSlug(courseSlug);
    if (lessonSlug) {
      router.push(`/khoa-hoc/${courseSlug}/bai-hoc/${lessonSlug}`);
    } else {
      router.push(`/khoa-hoc/${courseSlug}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Học tập</div>
      <h1 className="font-sans text-3xl font-bold">Khóa học của tôi</h1>
      <p className="mt-2 text-muted-foreground">Tiếp tục hành trình học tập của bạn.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (items ?? []).length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-secondary/40 py-16 text-center">
          <GraduationCap className="mb-3 h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Bạn chưa ghi danh khóa học nào.</p>
          <Button asChild className="mt-4"><Link href="/khoa-hoc">Khám phá khóa học</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((e) => (
            <div key={e?.id} className="group overflow-hidden rounded-xl bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Link href={`/khoa-hoc/${e?.course?.slug}`}>
                <div className="relative aspect-video bg-muted">
                  <Image src={e?.course?.thumbnail || "/images/course-1.jpg"} alt={e?.course?.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/khoa-hoc/${e?.course?.slug}`}>
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary">{e?.course?.title}</h3>
                </Link>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Tiến độ</span>
                    <span>{e?.progress ?? 0}% ({e?.completedLessons ?? 0}/{e?.totalLessons ?? 0})</span>
                  </div>
                  <Progress value={e?.progress ?? 0} />
                </div>
                <Button
                  size="sm"
                  className="mt-3 w-full gap-2"
                  onClick={(ev) => handleContinue(ev, e?.course?.slug)}
                >
                  <PlayCircle className="h-4 w-4" />
                  {e?.progress > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
