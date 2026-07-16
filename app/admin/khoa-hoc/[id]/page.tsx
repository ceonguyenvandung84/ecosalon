"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, ImageIcon, Trash2, Plus, X, Pencil, Play, Lock, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/site/avatar-upload";
import Image from "next/image";
import Link from "next/link";
import type { CourseDetailItem, CourseForm, CategoryAdminItem, InstructorOption } from "@/lib/types";
import type { LessonAttachment } from "@/lib/types";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  videoProvider: "YOUTUBE" | "VIMEO" | "S3" | "OTHER";
  durationMin: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
  attachments?: LessonAttachment[] | null;
}

export default function AdminCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<CourseDetailItem | null>(null);
  const [cats, setCats] = useState<CategoryAdminItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [form, setForm] = useState<CourseForm>({} as CourseForm);

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "", videoProvider: "YOUTUBE", durationMin: "15", isPreview: false, attachments: [] as LessonAttachment[] });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonUploading, setLessonUploading] = useState(false);

  const loadLessons = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/courses/${courseId}/lessons`);
      if (r.ok) setLessons(await r.json());
    } catch { /* ignore */ }
  }, [courseId]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/courses").then((r) => r.json()).then((d) => {
        const found = (d?.courses ?? []).find((c: CourseDetailItem) => c.id === courseId);
        if (found) setCourse(found);
      }),
      fetch("/api/categories?type=COURSE").then((r) => r.json()).then((d) => setCats(d?.categories ?? [])),
      fetch("/api/admin/users").then((r) => r.json()).then((d) => {
        setInstructors((d?.users ?? []).filter(({ role }: { role: string }) => role === "INSTRUCTOR"));
      }).catch((e) => { console.error("Failed to load instructors", e); toast.error("Không thể tải giảng viên."); }),
      loadLessons(),
    ]).finally(() => setLoading(false));
  }, [courseId, loadLessons]);

  useEffect(() => {
    if (course) {
      const detail = async () => {
        try {
          const r = await fetch(`/api/admin/courses/${courseId}`, { method: "GET" });
          if (r.ok) {
            const d = await r.json();
            setForm({
              title: d?.course?.title ?? course.title ?? "",
              shortDesc: d?.course?.shortDesc ?? course.shortDesc ?? "",
              description: d?.course?.description ?? course.description ?? "",
              thumbnailPath: d?.course?.thumbnailPath ?? course.thumbnail ?? null,
              thumbnailPublic: d?.course?.thumbnailPublic ?? true,
              price: String(d?.course?.price ?? course.price ?? 0),
              discountPrice: d?.course?.discountPrice ? String(d.course.discountPrice) : "",
              level: d?.course?.level ?? course.level ?? "BEGINNER",
              durationHours: String(d?.course?.durationHours ?? course.durationHours ?? 0),
              instructorName: d?.course?.instructorName ?? course.instructorName ?? "",
              instructorBio: d?.course?.instructorBio ?? "",
              instructorId: d?.course?.instructorId ?? "none",
              categoryId: d?.course?.categoryId ?? course.categoryId ?? cats[0]?.id ?? "",
              isPublished: d?.course?.isPublished ?? course.isPublished ?? true,
              isFeatured: d?.course?.isFeatured ?? course.isFeatured ?? false,
              metaTitle: d?.course?.metaTitle ?? "",
              metaDescription: d?.course?.metaDescription ?? "",
              ogImage: d?.course?.ogImage ?? "",
              requirements: d?.course?.requirements ?? [],
              objectives: d?.course?.objectives ?? [],
              tags: d?.course?.tags ?? [],
              prerequisiteIds: d?.course?.prerequisiteIds ?? [],
            } as CourseForm);
          }
        } catch { /* ignore */ }
      };
      detail();
    }
  }, [course, courseId]);

  const openNewLesson = () => { setEditingLesson(null); setLessonForm({ title: "", videoUrl: "", videoProvider: "YOUTUBE", durationMin: "15", isPreview: false, attachments: [] }); setLessonOpen(true); };

  const openEditLesson = (l: LessonItem) => { setEditingLesson(l); setLessonForm({ title: l.title, videoUrl: l.videoUrl ?? "", videoProvider: l.videoProvider, durationMin: String(l.durationMin), isPreview: l.isPreview, attachments: l.attachments ?? [] }); setLessonOpen(true); };

  const saveLesson = async () => {
    if (!lessonForm.title) { toast.error("Nhập tiêu đề bài học"); return; }
    setLessonSaving(true);
    try {
      const url = editingLesson ? `/api/admin/lessons/${editingLesson.id}` : `/api/admin/courses/${courseId}/lessons`;
      const res = await fetch(url, { method: editingLesson ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...lessonForm, durationMin: parseInt(lessonForm.durationMin) || 0, attachments: lessonForm.attachments?.length ? lessonForm.attachments : null }) });
      if (res.ok) { toast.success(editingLesson ? "Đã cập nhật video" : "Đã thêm video"); setLessonOpen(false); loadLessons(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setLessonSaving(false); }
  };

  const lessonUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("File tối đa 20MB"); e.target.value = ""; return; }
    setLessonUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload/local", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!d?.url) { toast.error(d?.error ?? "Upload thất bại"); return; }
      const att: LessonAttachment = { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: file.name.replace(/\.[^/.]+$/, ""), fileName: file.name, fileUrl: d.url, fileType: file.type, fileSize: file.size };
      setLessonForm((f) => ({ ...f, attachments: [...(f.attachments ?? []), att] }));
      toast.success("Đã tải file lên");
    } catch { toast.error("Lỗi upload"); } finally { setLessonUploading(false); e.target.value = ""; }
  };

  const lessonRemoveAttachment = (id: string) => {
    setLessonForm((f) => ({ ...f, attachments: (f.attachments ?? []).filter((a) => a.id !== id) }));
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Xóa bài học này?")) return;
    try { const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("Đã xóa"); loadLessons(); } else toast.error("Xóa thất bại"); } catch { toast.error("Lỗi"); }
  };

  const save = async () => {
    if (!form.title || !form.categoryId) { toast.error("Nhập tiêu đề và danh mục"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price || "0",
          durationHours: form.durationHours || "0",
          instructorId: form.instructorId === "none" ? null : form.instructorId || null,
          instructorBio: form.instructorBio || null,
        }),
      });
      if (res.ok) { toast.success("Đã cập nhật khóa học"); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Cập nhật thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="p-6 text-center text-muted-foreground">Không tìm thấy khóa học</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/khoa-hoc")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl font-bold line-clamp-1">{course.title}</h1>
            <Badge variant={course.isPublished ? "default" : "secondary"}>{course.isPublished ? "Hiển thị" : "Ẩn"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/admin/khoa-hoc/${courseId}/bai-hoc`} className="hover:underline">Quản lý bài học</Link>
            {" · "}Học viên: {course.studentsCount}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild><Link href={`/admin/khoa-hoc/${courseId}/bai-hoc`}>Bài học</Link></Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả ngắn</Label>
                <Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Giảng viên</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên giảng viên</Label>
                <Input value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Liên kết tài khoản giảng viên</Label>
                <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giảng viên (không bắt buộc)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không liên kết</SelectItem>
                    {instructors.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName ?? u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Liên kết với tài khoản giảng viên để hiển thị thông tin chi tiết.</p>
              </div>
              <div className="space-y-2">
                <Label>Giới thiệu giảng viên</Label>
                <Textarea rows={3} value={form.instructorBio} onChange={(e) => setForm({ ...form, instructorBio: e.target.value })} placeholder="Tiểu sử, kinh nghiệm, thành tích..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Giá & Thông số</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá (VND)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Giá khuyến mãi</Label>
                <Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} placeholder="Để trống nếu không" />
              </div>
              <div className="space-y-2">
                <Label>Danh mục *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    {(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cấp độ</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Cơ bản</SelectItem>
                    <SelectItem value="INTERMEDIATE">Trung cấp</SelectItem>
                    <SelectItem value="ADVANCED">Nâng cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số giờ học</Label>
                <Input type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Video bài học</CardTitle>
              <Button size="sm" onClick={openNewLesson} className="gap-1"><Plus className="h-4 w-4" /> Thêm video</Button>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có bài học nào. Bấm "Thêm video" để thêm link video và phân quyền xem.</p>
              ) : (
                <div className="divide-y">
                  {[...lessons].sort((a, b) => a.order - b.order).map((l) => (
                    <div key={l.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        {l.isPreview ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {l.videoUrl ? <Badge variant="outline" className="text-xs">{l.videoProvider}</Badge> : <span className="text-xs text-muted-foreground">Chưa có video</span>}
                          <span className="text-xs text-muted-foreground">{l.durationMin} ph</span>
                          {l.isPreview ? <Badge variant="secondary" className="text-xs">Xem thử</Badge> : <Badge variant="default" className="text-xs">Trả phí</Badge>}
                          {(l.attachments?.length ?? 0) > 0 ? <Badge variant="outline" className="text-xs gap-1"><File className="h-3 w-3" />{l.attachments?.length}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditLesson(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteLesson(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Yêu cầu & Mục tiêu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Yêu cầu đầu vào</Label>
                <div className="flex flex-wrap gap-2">
                  {(form.requirements ?? []).map((r: string, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {r}
                      <button onClick={() => setForm({ ...form, requirements: (form.requirements ?? []).filter((_, idx: number) => idx !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="VD: Có kiến thức cơ bản về cắt tóc"
                    value={form._reqInput ?? ""}
                    onChange={(e) => setForm({ ...form, _reqInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (form._reqInput ?? "").trim()) {
                        setForm({ ...form, requirements: [...(form.requirements ?? []), (form._reqInput ?? "").trim()], _reqInput: "" });
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if ((form._reqInput ?? "").trim()) {
                      setForm({ ...form, requirements: [...(form.requirements ?? []), (form._reqInput ?? "").trim()], _reqInput: "" });
                    }
                  }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mục tiêu khóa học</Label>
                <div className="flex flex-wrap gap-2">
                  {(form.objectives ?? []).map((r: string, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {r}
                      <button onClick={() => setForm({ ...form, objectives: (form.objectives ?? []).filter((_, idx: number) => idx !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="VD: Thành thạo kỹ thuật uốn tạo kiểu"
                    value={form._objInput ?? ""}
                    onChange={(e) => setForm({ ...form, _objInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (form._objInput ?? "").trim()) {
                        setForm({ ...form, objectives: [...(form.objectives ?? []), (form._objInput ?? "").trim()], _objInput: "" });
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if ((form._objInput ?? "").trim()) {
                      setForm({ ...form, objectives: [...(form.objectives ?? []), (form._objInput ?? "").trim()], _objInput: "" });
                    }
                  }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {(form.tags ?? []).map((r: string, i: number) => (
                    <Badge key={i} className="gap-1 pr-1">
                      {r}
                      <button onClick={() => setForm({ ...form, tags: (form.tags ?? []).filter((_, idx: number) => idx !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="VD: cắt-tóc, uốn-tóc"
                    value={form._tagInput ?? ""}
                    onChange={(e) => setForm({ ...form, _tagInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (form._tagInput ?? "").trim()) {
                        setForm({ ...form, tags: [...(form.tags ?? []), (form._tagInput ?? "").trim()], _tagInput: "" });
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if ((form._tagInput ?? "").trim()) {
                      setForm({ ...form, tags: [...(form.tags ?? []), (form._tagInput ?? "").trim()], _tagInput: "" });
                    }
                  }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Ảnh thumbnail</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {form.thumbnailPath ? (
                  <>
                    <Image src={form.thumbnailPath} alt="Thumbnail" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={() => setForm({ ...form, thumbnailPath: null })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm">Chưa có ảnh</p>
                  </div>
                )}
              </div>
              <AvatarUpload value={form.thumbnailPath} onUploaded={(path) => setForm({ ...form, thumbnailPath: path })} name={form.title} />
              <p className="text-xs text-muted-foreground">Click vào biểu tượng camera để tải ảnh lên (tối đa 5MB)</p>
              <div className="flex items-center gap-2">
                <Switch checked={form.thumbnailPublic ?? true} onCheckedChange={(v) => setForm({ ...form, thumbnailPublic: v })} />
                <Label className="text-sm">Công khai</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <Label>Hiển thị</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                <Label>Nổi bật</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5"><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="Tiêu đề SEO (để trống để dùng tiêu đề khóa học)" /></div>
              <div className="space-y-1.5"><Label>Meta Description</Label><Textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="Mô tả SEO" /></div>
              <div className="space-y-1.5"><Label>OG Image URL</Label><Input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} placeholder="Để trống để dùng thumbnail" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Thống kê</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Học viên</span><span className="font-medium">{course.studentsCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bài học</span><span className="font-medium">{course.lessonsCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span className="font-medium text-xs">{course.slug}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingLesson ? "Sửa video bài học" : "Thêm video bài học"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tiêu đề bài học *</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="VD: Cắt tóc nam cơ bản" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Video URL</Label><Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://youtube.com/..." /></div>
              <div className="space-y-1.5"><Label>Nền tảng</Label>
                <Select value={lessonForm.videoProvider} onValueChange={(v) => setLessonForm({ ...lessonForm, videoProvider: v })}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Thời lượng (phút)</Label><Input type="number" value={lessonForm.durationMin} onChange={(e) => setLessonForm({ ...lessonForm, durationMin: e.target.value })} /></div>
              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={lessonForm.isPreview} onCheckedChange={(v) => setLessonForm({ ...lessonForm, isPreview: v })} />
                  Cho xem thử miễn phí
                </label>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Label className="font-medium text-xs">Tài liệu đính kèm</Label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50">
                  {lessonUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Tải file
                  <input type="file" className="hidden" onChange={lessonUploadAttachment} disabled={lessonUploading} />
                </label>
                <span className="text-xs text-muted-foreground">PDF, DOC, ZIP (20MB)</span>
              </div>
              {(lessonForm.attachments ?? []).length > 0 && (
                <div className="space-y-1 mt-1">
                  {(lessonForm.attachments ?? []).map((att) => (
                    <div key={att.id} className="flex items-center gap-2 rounded bg-secondary/30 px-2 py-1.5 text-xs">
                      <File className="h-3 w-3 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{att.fileName}</span>
                      <button onClick={() => lessonRemoveAttachment(att.id)} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {lessonForm.isPreview
                ? "Video này sẽ được xem miễn phí, không cần ghi danh."
                : "Video này chỉ dành cho học viên đã ghi danh/mua khóa học."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLessonOpen(false)}>Hủy</Button>
            <Button onClick={saveLesson} disabled={lessonSaving}>
              {lessonSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
