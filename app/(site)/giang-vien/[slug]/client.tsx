"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, BookOpen, Users, Clock, GraduationCap, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface InstructorData {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  bio: string | null;
  phone: string | null;
  profile: {
    title: string | null;
    expertise: string[];
    education: string | null;
    socialLinks: unknown;
    totalStudents: number;
    totalRevenue: number;
    rating: number;
  } | null;
  courses: Array<{
    id: string; title: string; slug: string; shortDesc?: string;
    thumbnail?: string; price: number; discountPrice?: number;
    level?: string; durationHours?: number; studentsCount?: number;
    lessonsCount?: number; reviewsCount?: number;
  }>;
}

export function InstructorProfileClient({ instructor }: { instructor: InstructorData }) {
  const p = instructor.profile;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
            {instructor.avatar ? (
              <Image src={instructor.avatar} alt={instructor.fullName} fill className="object-cover" sizes="128px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                {instructor.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-sans text-2xl font-bold">{instructor.fullName}</h1>
            {p?.title && <p className="text-muted-foreground">{p.title}</p>}
            {instructor.bio && <p className="mt-2 text-sm text-muted-foreground">{instructor.bio}</p>}
            {p?.expertise && p.expertise.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
                {p.expertise.map((exp) => (
                  <Badge key={exp} variant="secondary">{exp}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {p && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <GraduationCap className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-lg font-bold">{p.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Học viên</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <DollarSign className="mx-auto mb-1 h-5 w-5 text-green-600" />
              <p className="text-lg font-bold">{formatPrice(p.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Doanh thu</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <Star className="mx-auto mb-1 h-5 w-5 text-yellow-600" />
              <p className="text-lg font-bold">{p.rating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Đánh giá</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <BookOpen className="mx-auto mb-1 h-5 w-5 text-blue-600" />
              <p className="text-lg font-bold">{instructor.courses.length}</p>
              <p className="text-xs text-muted-foreground">Khóa học</p>
            </div>
          </div>
        )}

        {instructor.courses.length > 0 && (
          <div className="mt-8">
            <h2 className="font-sans text-lg font-bold mb-4">Khóa học ({instructor.courses.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {instructor.courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-40 bg-muted">
                    {course.thumbnail ? (
                      <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                    {course.discountPrice != null && course.discountPrice < course.price && (
                      <Badge className="absolute left-2 top-2">Giảm {Math.round((1 - course.discountPrice / course.price) * 100)}%</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/khoa-hoc/${course.slug}`} className="font-semibold hover:text-primary line-clamp-1">{course.title}</Link>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.shortDesc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.studentsCount}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.durationHours}h</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lessonsCount}</span>
                      </div>
                      <div className="text-right">
                        {course.discountPrice != null ? (
                          <div>
                            <span className="font-bold text-primary">{formatPrice(course.discountPrice)}</span>
                            <span className="ml-1 text-xs text-muted-foreground line-through">{formatPrice(course.price)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">{formatPrice(course.price)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
