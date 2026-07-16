"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, Star, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function InstructorCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{
    course: {
      id: string; title: string; avgRating: number; unansweredQuestions: number;
      _count: { lessons: number; enrollments: number; reviews: number };
      enrollments: Array<{ id: string; progress: number; enrolledAt: string; user: { fullName?: string; email: string } }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (session.user?.role !== "INSTRUCTOR" && session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetch(`/api/instructor/courses/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [session, id, router]);

  if (loading || !data) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  const { course } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild><Link href="/instructor"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1">
          <h1 className="font-sans text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            {course._count.lessons} bài học &middot; {course._count.enrollments} học viên &middot; Đánh giá {course.avgRating.toFixed(1)}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/khoa-hoc/${id}/bai-hoc`}>Quản lý bài học</Link>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-6 w-6 text-blue-600 mb-2" />
          <p className="text-xl font-bold">{course._count.enrollments}</p>
          <p className="text-xs text-muted-foreground">Học viên</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Star className="h-6 w-6 text-yellow-600 mb-2" />
          <p className="text-xl font-bold">{course.avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Đánh giá ({course._count.reviews})</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <MessageSquare className="h-6 w-6 text-orange-600 mb-2" />
          <p className="text-xl font-bold">{course.unansweredQuestions}</p>
          <p className="text-xs text-muted-foreground">Câu hỏi chưa trả lời</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <BookOpen className="h-6 w-6 text-primary mb-2" />
          <p className="text-xl font-bold">{course._count.lessons}</p>
          <p className="text-xs text-muted-foreground">Bài học</p>
        </div>
      </div>

      <h2 className="font-sans text-lg font-bold mb-4">Học viên ({course._count.enrollments})</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Ngày tham gia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {course.enrollments.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Chưa có học viên</TableCell></TableRow>
            ) : (
              course.enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {e.user.fullName?.charAt(0) || "?"}
                    </div>
                    {e.user.fullName || "Ẩn danh"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${e.progress}%` }} />
                      </div>
                      <span className="text-xs">{e.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(e.enrolledAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}