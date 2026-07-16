"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, BarChart, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { QuizResultsData } from "@/lib/types";

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<QuizResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/quiz/${id}/results`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { toast.error("Không tải được dữ liệu"); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!data?.quiz) return <div className="p-8 text-center">Không tìm thấy quiz</div>;

  const { quiz, stats, attempts } = data;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild><Link href={`/admin/quiz/${id}`}><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div>
          <h1 className="font-sans text-2xl font-bold">Kết quả Quiz</h1>
          <p className="text-sm text-muted-foreground">{quiz.title} — {quiz.lesson?.title}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Lượt làm</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Điểm trung bình</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.passRate}%</p>
              <p className="text-xs text-muted-foreground">Tỷ lệ đạt</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <BarChart className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{data.questions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Số câu hỏi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Kết quả</TableHead>
              <TableHead>Thời gian làm</TableHead>
              <TableHead>Ngày làm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Chưa có lượt làm nào</TableCell>
              </TableRow>
            ) : (
              attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.user.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-16 rounded-full bg-secondary`}>
                        <div className={`h-2 rounded-full ${a.passed ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${a.score}%` }} />
                      </div>
                      <span className="text-sm font-medium">{a.score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.passed
                      ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Đạt</Badge>
                      : <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Không đạt</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-sm">{a.timeSpent ? `${Math.floor(a.timeSpent / 60)}p ${a.timeSpent % 60}s` : "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.completedAt ? new Date(a.completedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}