"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Users, BookOpen, Loader2, CheckCircle2, GraduationCap, ChevronRight, PlayCircle, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RatingStars } from "@/components/site/rating-stars";
import { QuestionsSection } from "@/components/site/course-questions";
import { ReviewForm } from "@/components/site/review-form";
import { SiteBreadcrumbs } from "@/components/site/site-breadcrumbs";
import { formatPrice, formatNumber, formatDate } from "@/lib/utils";
import { LEVEL_LABELS } from "@/lib/types";
import { toast } from "sonner";

export default function CourseDetailPage() {
  const { data: session } = useSession();
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [course, setCourse] = useState<{
    id: string; title: string; shortDesc?: string; description?: string; thumbnail?: string;
    category?: string; rating?: number; reviewsCount?: number; studentsCount?: number;
    durationHours?: number; level?: string; price: number; discountPrice?: number;
    isEnrolled?: boolean; instructorName?: string; instructorAvatar?: string; instructorBio?: string;
    reviews?: Array<{ id: string; userName?: string; rating: number; comment?: string; createdAt: string }>;
  } | null>(null);
  const [lessons, setLessons] = useState<Array<{ id: string; title: string; slug: string; description?: string; durationMin: number; canView: boolean; completed?: boolean; isPreview?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [fav, setFav] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`/api/courses/${slug}`),
        fetch(`/api/courses/${slug}/lessons`),
      ]);
      const courseData = await courseRes.json();
      setCourse(courseData?.course ?? null);
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData?.lessons ?? []);
      }
    } catch { setCourse(null); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { if (slug) load(); }, [slug, load, setLoading, setCourse, setLessons]);

  useEffect(() => {
    if (course?.id) fetch("/api/course-wishlist/ids").then((r) => r.json()).then((d) => setFav((d?.ids ?? []).includes(course?.id))).catch((e) => console.error("Failed to load wishlist", e));
  }, [course?.id, setFav]);

  const toggleFav = async () => {
    if (!session?.user) { router.push(`/dang-nhap?callbackUrl=/khoa-hoc/${slug}`); return; }
    try {
      const res = await fetch("/api/course-wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: course?.id }) });
      const d = await res.json().catch(() => ({}));
      setFav(!!d?.inWishlist);
      toast.success(d?.inWishlist ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
    } catch { toast.error("Đã có lỗi xảy ra"); }
  };

  const enroll = async () => {
    if (!session?.user) { router.push(`/dang-nhap?callbackUrl=/khoa-hoc/${slug}`); return; }
    setEnrolling(true);
    try {
      const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: course?.id }) });
      if (res.ok) { toast.success("Ghi danh thành công!"); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Ghi danh thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setEnrolling(false); }
  };

  const goToLesson = (lessonSlug: string) => {
    router.push(`/khoa-hoc/${slug}/bai-hoc/${lessonSlug}`);
  };

  const goToFirstLesson = () => {
    const first = lessons.find((l) => l.canView);
    if (first) goToLesson(first.slug);
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="py-32 text-center text-muted-foreground">Không tìm thấy khóa học.</div>;

  const hasDiscount = !!course?.discountPrice && (course.discountPrice ?? 0) < course.price;

  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-8">
        <SiteBreadcrumbs items={[{ label: "Khóa học", href: "/khoa-hoc" }, { label: course?.title ?? "" }]} />
      </div>
      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <Badge variant="secondary" className="mb-3">{course?.category}</Badge>
            <h1 className="font-sans text-3xl font-bold md:text-4xl">{course?.title}</h1>
            <p className="mt-3 text-background/80">{course?.shortDesc}</p>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-background/80">
              <span className="flex items-center gap-1.5"><RatingStars rating={course?.rating ?? 0} size={16} /> {course?.rating} ({formatNumber(course?.reviewsCount)} đánh giá)</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {formatNumber(course?.studentsCount)} học viên</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course?.durationHours} giờ</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {lessons.length} bài học</span>
              <Badge>{LEVEL_LABELS[course?.level ?? ""] ?? course?.level}</Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-10 lg:col-span-2">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-md">
            <Image src={course?.thumbnail || "/images/course-1.jpg"} alt={course?.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" />
          </div>

          <div>
            <h2 className="mb-3 font-sans text-2xl font-bold">Giới thiệu khóa học</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{course?.description}</p>
          </div>

          <div>
            <h2 className="mb-3 font-sans text-2xl font-bold">Nội dung khóa học</h2>
            {course?.isEnrolled && (
              <div className="mb-4 flex items-center gap-3 text-sm">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-muted-foreground whitespace-nowrap">{completedCount}/{lessons.length} ({progress}%)</span>
              </div>
            )}
            <Accordion type="single" collapsible className="rounded-xl bg-card px-4 shadow-sm">
              {lessons.map((l, i) => (
                <AccordionItem key={l?.id ?? i} value={`l-${i}`}>
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-3">
                      {l.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : l.canView ? (
                        <PlayCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>Bài {i + 1}: {l?.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{l?.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{l?.durationMin} phút {l?.isPreview ? "• Xem thử miễn phí" : ""}</p>
                      {l.canView && (
                        <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => goToLesson(l.slug)}>
                          {l.completed ? "Xem lại" : "Học ngay"} <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="rounded-xl bg-secondary/40 p-6">
            <h2 className="mb-4 font-sans text-xl font-bold">Giảng viên</h2>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {course?.instructorAvatar ? <Image src={course.instructorAvatar} alt={course?.instructorName ?? ""} fill className="object-cover" sizes="64px" /> : <span>{(course?.instructorName ?? "?").charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <div className="font-semibold">{course?.instructorName}</div>
                <p className="text-sm text-muted-foreground">{course?.instructorBio}</p>
              </div>
            </div>
          </div>

          {/* Q&A */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold">Hỏi & Đáp</h2>
            <QuestionsSection courseSlug={slug} isEnrolled={course?.isEnrolled} />
          </div>

          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold">Đánh giá ({formatNumber(course?.reviewsCount)})</h2>
            <div className="mb-4">
              <ReviewForm courseId={course?.id} onSuccess={() => { load(); }} />
            </div>
            <div className="space-y-4">
              {(course?.reviews ?? []).length === 0 ? <p className="text-muted-foreground">Chưa có đánh giá nào.</p> : (course?.reviews ?? []).map((r) => (
                <div key={r?.id} className="rounded-xl bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r?.userName}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(r?.createdAt)}</span>
                  </div>
                  <RatingStars rating={r?.rating ?? 0} size={14} />
                  <p className="mt-2 text-sm text-muted-foreground">{r?.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-24 rounded-xl bg-card p-6 shadow-lg">
            <div className="flex items-end gap-3">
              <span className="font-sans text-3xl font-bold text-primary">{formatPrice(hasDiscount ? course?.discountPrice : course?.price)}</span>
              {hasDiscount ? <span className="mb-1 text-muted-foreground line-through">{formatPrice(course?.price)}</span> : null}
            </div>
            {course?.isEnrolled ? (
              <Button className="mt-5 w-full gap-2" onClick={goToFirstLesson}>
                <PlayCircle className="h-5 w-5" />
                {progress > 0 ? "Tiếp tục học" : "Vào học"}
              </Button>
            ) : (
              (course?.price ?? 0) > 0 ? (
                <div className="mt-5 space-y-2">
                  <Button className="w-full gap-2" variant="default" onClick={() => router.push(`/thanh-toan/khoa-hoc?courses=${course?.id}`)}>
                    Mua khóa học
                  </Button>
                  <Button className="w-full gap-2" variant="outline" onClick={enroll} disabled={enrolling}>
                    {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : <><GraduationCap className="h-5 w-5" /> Ghi danh miễn phí</>}
                  </Button>
                </div>
              ) : (
                <Button className="mt-5 w-full gap-2" onClick={enroll} disabled={enrolling}>
                  {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : <><GraduationCap className="h-5 w-5" /> Ghi danh ngay miễn phí</>}
                </Button>
              )
            )}
            <Button variant="ghost" className="mt-3 w-full gap-2" onClick={toggleFav}>
              <Heart className={`h-5 w-5 ${fav ? "fill-destructive text-destructive" : ""}`} />
              {fav ? "Đã yêu thích" : "Yêu thích"}
            </Button>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {lessons.length} bài học chi tiết</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {course?.durationHours} giờ nội dung</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Truy cập trọn đời</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Chứng chỉ hoàn thành</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
