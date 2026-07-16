"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Users, BookOpen, Heart } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RatingStars } from "./rating-stars";
import { formatPrice, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface CourseCardData {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  thumbnail: string;
  price: number;
  discountPrice: number | null;
  level: string;
  durationHours: number;
  instructorName: string;
  category: string;
  rating: number;
  reviewsCount: number;
  lessonsCount: number;
  studentsCount: number;
}

export function CourseCard({
  course,
  index = 0,
  initialFavorite = false,
  onToggle,
}: {
  course: CourseCardData;
  index?: number;
  initialFavorite?: boolean;
  onToggle?: (id: string, fav: boolean) => void;
}) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const hasDiscount = !!course?.discountPrice && course.discountPrice < course.price;

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để lưu khóa học yêu thích.");
      router.push("/dang-nhap");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/course-wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFav(!!data?.inWishlist);
        onToggle?.(course?.id, !!data?.inWishlist);
        toast.success(data?.inWishlist ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
      }
    } catch {
      toast.error("Thao tác thất bại.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${(index % 4) * 60}ms` }}
    >
      <Link
        href={`/khoa-hoc/${course?.slug ?? ""}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {course?.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course?.title ?? "Khóa học"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 25vw"
            />
          ) : null}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-primary/90 text-primary-foreground shadow-sm">{course?.level}</Badge>
          </div>
          <button
            type="button"
            onClick={toggleFav}
            aria-label="Yêu thích"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
          >
            <Heart className={cn("h-4.5 w-4.5", fav ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
          </button>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">{course?.category}</p>
          <h3 className="line-clamp-2 font-sans text-base font-bold leading-snug text-foreground">
            {course?.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course?.shortDesc}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course?.durationHours}h</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course?.lessonsCount} bài</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course?.studentsCount}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={course?.rating ?? 0} />
            <span className="text-xs text-muted-foreground">{(course?.rating ?? 0).toFixed(1)} ({course?.reviewsCount})</span>
          </div>
          <div className="mt-auto pt-3">
            <div className="flex items-end gap-2">
              <span className="font-sans text-lg font-extrabold text-primary">
                {formatPrice(hasDiscount ? course.discountPrice! : course?.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">{formatPrice(course?.price)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
