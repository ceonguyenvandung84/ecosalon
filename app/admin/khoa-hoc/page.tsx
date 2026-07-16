"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, Download, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { formatPrice, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { AvatarUpload } from "@/components/site/avatar-upload";
import type { CourseDetailItem, CourseForm, CategoryAdminItem, InstructorOption } from "@/lib/types";

const empty: CourseForm = { title: "", shortDesc: "", description: "", price: "", discountPrice: "", level: "BEGINNER", durationHours: "", instructorName: "", instructorBio: "", instructorId: "none", thumbnailPath: null, categoryId: "", isFeatured: false, isPublished: true, discountPercent: "", rating: 0, reviewsCount: "0", lessonsCount: "0", studentsCount: "0", thumbnailPublic: true };

export default function AdminCoursesPage() {
  const [items, setItems] = useState<CourseDetailItem[]>([]);
  const [cats, setCats] = useState<CategoryAdminItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseDetailItem | null>(null);
  const [form, setForm] = useState<CourseForm>(empty as CourseForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => { setLoading(true); fetch("/api/admin/courses").then((r) => r.json()).then((d) => setItems(d?.courses ?? [])).catch(() => { toast.error("Không thể tải dữ liệu."); }).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    load();
    fetch("/api/categories?type=COURSE").then((r) => r.json()).then((d) => setCats(d?.categories ?? [])).catch((e) => { console.error("Failed to load categories", e); toast.error("Không thể tải danh mục."); });
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setInstructors((d?.users ?? []).filter(({ role }: { role: string }) => role === "INSTRUCTOR"))).catch((e) => { console.error("Failed to load instructors", e); toast.error("Không thể tải giảng viên."); });
  }, [load, setLoading, setItems, setCats, setInstructors]);

  const openNew = () => { setEditing(null); setForm({ ...empty, categoryId: cats?.[0]?.id ?? "" }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.categoryId) { toast.error("Nhập tiêu đề và danh mục"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/courses/${editing.id}` : "/api/admin/courses";
      const body = { ...form, instructorId: form.instructorId === "none" ? null : form.instructorId };
      const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        if (editing) { toast.success("Đã cập nhật"); setOpen(false); load(); return; }
        const data = await res.json().catch(() => ({}));
        setOpen(false); load();
        toast("Đã tạo khóa học", { action: { label: "Thêm video", onClick: () => window.location.href = `/admin/khoa-hoc/${data.id}/bai-hoc` } });
      }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Xóa khóa học này?")) return;
    try { const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Xóa thất bại"); } catch { toast.error("Lỗi"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Quản lý khóa học</h1><p className="text-muted-foreground">{formatNumber(items?.length ?? 0)} khóa học</p></div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=courses" download className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </a>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm khóa học</Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : (
        <Table>
          <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Danh mục</TableHead><TableHead>Giá</TableHead><TableHead>HV</TableHead><TableHead>Bài học</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {(items ?? []).map((c: CourseDetailItem) => (
              <TableRow key={c?.id}>
                <TableCell className="max-w-[260px] font-medium">{c?.title}{c?.isFeatured ? <Badge className="ml-2" variant="secondary">Nổi bật</Badge> : null}</TableCell>
                <TableCell>{c?.category}</TableCell>
                <TableCell>{formatPrice(c?.discountPrice ?? c?.price)}</TableCell>
                <TableCell>{formatNumber(c?.studentsCount)}</TableCell>
                <TableCell>
                  <Link href={`/admin/khoa-hoc/${c?.id}/bai-hoc`} className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                    <Video className="h-3.5 w-3.5" />
                    {c?.lessonsCount ?? 0} bài
                  </Link>
                </TableCell>
                <TableCell><Badge variant={c?.isPublished ? "default" : "secondary"}>{c?.isPublished ? "Hiển thị" : "Ẩn"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/khoa-hoc/${c?.id}`}><Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button></Link>
                  <Link href={`/admin/khoa-hoc/${c?.id}/bai-hoc`}><Button size="icon" variant="ghost"><BookOpen className="h-4 w-4" /></Button></Link>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(c?.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa khóa học" : "Thêm khóa học"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả ngắn</Label><Input value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả chi tiết</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Ảnh thumbnail</Label>
              <div className="flex items-center gap-3">
                <AvatarUpload value={form.thumbnailPath} onUploaded={(path) => setForm((f) => ({ ...f, thumbnailPath: path }))} name={form.title} />
                {form.thumbnailPath && (
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setForm((f) => ({ ...f, thumbnailPath: null }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Giá (VND)</Label><Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Giá KM</Label><Input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Danh mục *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}><SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger><SelectContent>{(cats ?? []).map((c) => <SelectItem key={c?.id} value={c?.id}>{c?.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Cấp độ</Label>
                <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BEGINNER">Cơ bản</SelectItem><SelectItem value="INTERMEDIATE">Trung cấp</SelectItem><SelectItem value="ADVANCED">Nâng cao</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Số giờ</Label><Input type="number" value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Giảng viên</Label><Input value={form.instructorName} onChange={(e) => setForm((f) => ({ ...f, instructorName: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Giới thiệu giảng viên</Label>
              <Textarea rows={2} value={form.instructorBio} onChange={(e) => setForm((f) => ({ ...f, instructorBio: e.target.value }))} placeholder="Tiểu sử, kinh nghiệm..." />
            </div>
            {instructors.length > 0 && (
              <div className="space-y-1.5">
                <Label>Liên kết tài khoản</Label>
                <Select value={form.instructorId} onValueChange={(v) => setForm((f) => ({ ...f, instructorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Không liên kết" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không liên kết</SelectItem>
                    {instructors.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName ?? u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch id="isFeatured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} /><Label htmlFor="isFeatured">Nổi bật</Label></div>
              <div className="flex items-center gap-2"><Switch id="isPublished" checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} /><Label htmlFor="isPublished">Hiển thị</Label></div>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
            Sau khi tạo sẽ chuyển đến mục <strong>Thêm video bài học</strong> &rarr; nhập link YouTube/Vimeo/S3, bật <strong>"Cho xem thử"</strong> nếu muốn xem miễn phí.
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
