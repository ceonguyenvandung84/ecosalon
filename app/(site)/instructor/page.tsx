"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, BookOpen, Users, DollarSign, Star, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatNumber } from "@/lib/utils";

export default function InstructorDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{
    stats: { totalCourses: number; totalStudents: number; totalRevenue: number; avgRating: number; reviewCount: number };
    courses: Array<{ id: string; title: string; slug: string; isPublished: boolean; _count: { enrollments: number; lessons: number } }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (session.user?.role !== "INSTRUCTOR" && session.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetch("/api/instructor/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [session, router]);

  if (loading || !data) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold">Dashboard Giảng viên</h1>
          <p className="text-sm text-muted-foreground">Quản lý khóa học và học viên của bạn.</p>
        </div>
        <Button asChild>
          <Link href="/admin/khoa-hoc"><Plus className="mr-2 h-4 w-4" /> Tạo khóa học</Link>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <BookOpen className="h-8 w-8 text-primary mb-2" />
          <p className="text-2xl font-bold">{data.stats.totalCourses}</p>
          <p className="text-xs text-muted-foreground">Khóa học</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{formatNumber(data.stats.totalStudents)}</p>
          <p className="text-xs text-muted-foreground">Học viên</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Doanh thu</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Star className="h-8 w-8 text-yellow-600 mb-2" />
          <p className="text-2xl font-bold">{data.stats.avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Đánh giá ({data.stats.reviewCount})</p>
        </div>
      </div>

      <h2 className="font-sans text-lg font-bold mb-4">Khóa học của tôi</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khóa học</TableHead>
              <TableHead>Học viên</TableHead>
              <TableHead>Bài học</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.courses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Chưa có khóa học</TableCell></TableRow>
            ) : (
              data.courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c._count.enrollments}</TableCell>
                  <TableCell>{c._count.lessons}</TableCell>
                  <TableCell>
                    {c.isPublished ? <Badge>Đã xuất bản</Badge> : <Badge variant="secondary">Bản nháp</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/khoa-hoc/${c.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/instructor/khoa-hoc/${c.id}`}><Users className="h-4 w-4" /></Link>
                    </Button>
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