"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Pencil, Trash2, Loader2, GripVertical, Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const RichTextEditor = dynamic(() => import("@/components/admin/rich-text-editor").then((m) => m.RichTextEditor), { ssr: false });
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
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
  attachments?: LessonAttachment[] | null;
  durationMin: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  videoUrl: "",
  videoProvider: "YOUTUBE",
  thumbnailPath: "",
  attachments: [] as LessonAttachment[],
  durationMin: "15",
  isPreview: false,
  isPublished: true,
};

export default function AdminLessonPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/courses/${courseId}/lessons`),
        fetch("/api/admin/courses"),
      ]);
      if (lessonsRes.ok) {
        const d = await lessonsRes.json();
        setLessons(d ?? []);
      }
      if (coursesRes.ok) {
        const d = await coursesRes.json();
        const course = (d?.courses ?? []).find((c: { id: string }) => c.id === courseId);
        if (course) setCourseTitle(course.title);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { load(); }, [load, setLoading, setLessons, setCourseTitle]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description ?? "",
      content: l.content ?? "",
      videoUrl: l.videoUrl ?? "",
      videoProvider: l.videoProvider,
      thumbnailPath: l.thumbnailPath ?? "",
      attachments: l.attachments ?? [],
      durationMin: String(l.durationMin),
      isPreview: l.isPreview,
      isPublished: l.isPublished,
    });
    setOpen(true);
  };

  const uploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File tối đa 20MB"); e.target.value = ""; return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/local", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!d?.url) { toast.error(d?.error ?? "Upload thất bại"); return; }
      const att: LessonAttachment = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileUrl: d.url,
        fileType: file.type,
        fileSize: file.size,
      };
      setForm((f) => ({ ...f, attachments: [...(f.attachments ?? []), att] }));
      toast.success("Đã tải file lên");
    } catch { toast.error("Lỗi upload"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeAttachment = (id: string) => {
    setForm((f) => ({ ...f, attachments: (f.attachments ?? []).filter((a) => a.id !== id) }));
  };

  const save = async () => {
    if (!form.title) { toast.error("Nhập tiêu đề bài học"); return; }
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/lessons/${editing.id}`
        : `/api/admin/courses/${courseId}/lessons`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMin: parseInt(form.durationMin) || 0,
          attachments: form.attachments?.length ? form.attachments : null,
        }),
      });
      if (res.ok) {
        toast.success(editing ? "Đã cập nhật bài học" : "Đã tạo bài học");
        setOpen(false);
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? "Thất bại");
      }
    } catch { toast.error("Đã có lỗi xảy ra"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Xóa bài học này?")) return;
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa"); load(); }
      else toast.error("Xóa thất bại");
    } catch { toast.error("Lỗi"); }
  };

  const moveLesson = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= lessons.length) return;
    const updated = [...lessons];
    const [moved] = updated.splice(fromIndex, 1); if (!moved) return;
    updated.splice(toIndex, 0, moved);
    setLessons(updated);
    try {
      await fetch(`/api/admin/courses/${courseId}/lessons/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: updated.map((l) => l.id) }),
      });
    } catch { load(); }
  };

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/admin/khoa-hoc" className="hover:text-foreground transition-colors">Khóa học</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{courseTitle || "Bài học"}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Quản lý bài học</h1>
          <p className="text-muted-foreground">{lessons.length} bài học</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm bài học</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <p>Chưa có bài học nào</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>Thêm bài học đầu tiên</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10">STT</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Thời lượng</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Xem thử</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((l, i) => (
                <TableRow key={l.id} className={draggedIndex === i ? "opacity-50" : ""}>
                  <TableCell>
                    <button
                      draggable
                      onDragStart={() => setDraggedIndex(i)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => { if (draggedIndex !== null && draggedIndex !== i) { moveLesson(draggedIndex, i); setDraggedIndex(null); } }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className="cursor-grab text-muted-foreground hover:text-foreground"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell className="max-w-[260px] font-medium truncate">{l.title}</TableCell>
                  <TableCell>{l.durationMin} ph</TableCell>
                  <TableCell>
                    {l.videoUrl ? (
                      <Badge variant="outline" className="text-xs">{l.videoProvider}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {l.isPreview ? <Badge variant="secondary">Có</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.isPublished ? "default" : "secondary"}>
                      {l.isPublished ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Sửa bài học" : "Thêm bài học"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả ngắn</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Nội dung bài học (HTML)</Label><RichTextEditor value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} placeholder="Nhập nội dung bài học..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Video URL</Label><Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." /></div>
              <div className="space-y-1.5"><Label>Nền tảng</Label>
                <Select value={form.videoProvider} onValueChange={(v) => setForm((f) => ({ ...f, videoProvider: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="VIMEO">Vimeo</SelectItem>
                    <SelectItem value="S3">S3</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Ảnh thumbnail</Label><Input value={form.thumbnailPath} onChange={(e) => setForm((f) => ({ ...f, thumbnailPath: e.target.value }))} placeholder="/images/..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Thời lượng (phút)</Label><Input type="number" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} /></div>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Label className="font-medium">Tài liệu đính kèm</Label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Tải file lên
                  <input type="file" className="hidden" onChange={uploadAttachment} disabled={uploading} />
                </label>
                <span className="text-xs text-muted-foreground">PDF, DOC, Excel, ZIP, TXT (tối đa 20MB)</span>
              </div>
              {(form.attachments ?? []).length > 0 && (
                <div className="space-y-1 mt-2">
                  {(form.attachments ?? []).map((att) => (
                    <div key={att.id} className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                      <File className="h-4 w-4 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{att.fileName}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeAttachment(att.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isPreview} onCheckedChange={(v) => setForm((f) => ({ ...f, isPreview: v }))} />
                Cho xem thử
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                Hiển thị
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
