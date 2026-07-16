"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, Brain, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { QuizDetailItem, QuizForm } from "@/lib/types";

export default function AdminQuizPage() {
  const [items, setItems] = useState<QuizDetailItem[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string; course?: { title: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<QuizDetailItem | null>(null);
  const [form, setForm] = useState<QuizForm>({ lessonId: "", title: "", description: "", passPercent: 70, timeLimit: 0, attemptLimit: 0, isPublished: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/quiz").then((r) => r.json()).then((d) => setItems(d?.quizzes ?? [])),
      fetch("/api/admin/lessons").then((r) => r.ok ? r.json() : { lessons: [] }).then((d) => setLessons(d?.lessons ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

  const openNew = () => {
    setEditing(null);
    setForm({ lessonId: "", title: "", description: "", passPercent: 70, timeLimit: 0, attemptLimit: 0, isPublished: false });
    setOpen(true);
  };

  const save = async () => {
    if (!form.lessonId) { toast.error("Vui lòng chọn bài học"); return; }
    if (!form.title.trim()) { toast.error("Vui lòng nhập tiêu đề quiz"); return; }

    setSaving(true);
    try {
      const url = editing ? `/api/admin/quiz/${editing.id}` : "/api/admin/quiz";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: form.lessonId,
          title: form.title,
          description: form.description || null,
          passPercent: Number(form.passPercent),
          timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
          attemptLimit: Number(form.attemptLimit) || 0,
          isPublished: form.isPublished,
        }),
      });

      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lưu thất bại"); return; }
      toast.success(editing ? "Đã cập nhật" : "Đã tạo quiz");
      setOpen(false);
      load();
    } catch { toast.error("Lỗi server"); }
    finally { setSaving(false); }
  };

  const remove = async (q: QuizDetailItem) => {
    if (!confirm(`Xóa quiz "${q.title}"? Tất cả câu hỏi và kết quả sẽ bị xóa.`)) return;
    const res = await fetch(`/api/admin/quiz/${q.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); }
    else toast.error("Xóa thất bại");
  };

  const getLessonTitle = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    return lesson?.title ?? lessonId;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo và quản lý bài kiểm tra cho bài học.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Tạo quiz mới</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center py-20 rounded-xl border border-dashed text-muted-foreground">
          <Brain className="mb-3 h-10 w-10" />
          <p>Chưa có quiz nào</p>
          <p className="text-sm">Tạo quiz cho bài học để kiểm tra học viên.</p>
          <Button variant="outline" className="mt-4" onClick={openNew}>Tạo quiz đầu tiên</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Bài học</TableHead>
                <TableHead>Câu hỏi</TableHead>
                <TableHead>Lượt làm</TableHead>
                <TableHead>Đạt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{q.title}</span>
                      {q.description ? <span className="text-xs text-muted-foreground line-clamp-1">{q.description}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getLessonTitle(q.lessonId)}</span>
                  </TableCell>
                  <TableCell>{q.questionCount}</TableCell>
                  <TableCell>{q.attemptCount}</TableCell>
                  <TableCell>
                    <span className="text-sm">{q.passPercent}%</span>
                  </TableCell>
                  <TableCell>
                    {q.isPublished ? (
                      <Badge>Đã xuất bản</Badge>
                    ) : (
                      <Badge variant="secondary">Bản nháp</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/quiz/${q.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/quiz/${q.id}/results`}><BarChart className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(q)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>{editing ? "Sửa quiz" : "Tạo quiz mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bài học *</Label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.lessonId}
                onChange={(e) => {
                  const lesson = lessons.find((l) => l.id === e.target.value);
                  setForm({ ...form, lessonId: e.target.value, title: lesson ? `${lesson.title} - Quiz` : form.title });
                }}
                disabled={!!editing}
              >
                <option value="">-- Chọn bài học --</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title} ({l.course?.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề quiz *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Kiểm tra chương 1" />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn (tùy chọn)" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>% đạt</Label>
                <Input type="number" min="1" max="100" value={form.passPercent} onChange={(e) => setForm({ ...form, passPercent: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Thời gian (phút)</Label>
                <Input type="number" min="0" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })} placeholder="0 = không giới hạn" />
              </div>
              <div className="space-y-2">
                <Label>Số lần làm</Label>
                <Input type="number" min="0" value={form.attemptLimit} onChange={(e) => setForm({ ...form, attemptLimit: Number(e.target.value) })} placeholder="0 = không giới hạn" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
              <Label>Đã xuất bản</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Tạo quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}