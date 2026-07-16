"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ScrollText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";

import type { CertTemplateAdminItem, CertTemplateForm, CertField } from "@/lib/types";
import { CERT_FIELD_KEYS } from "@/lib/types";

const emptyForm: CertTemplateForm = { title: "", description: "", svgTemplate: "", backgroundPath: null, fields: [], isDefault: false, isActive: true };

const defaultField = (key?: string): CertField => ({
  key: key ?? "studentName",
  label: CERT_FIELD_KEYS.find((f) => f.key === (key ?? "studentName"))?.label ?? key ?? "studentName",
  x: 400,
  y: 200,
  fontSize: 32,
  color: "#1a365d",
  align: "center",
  width: 600,
});

export default function AdminCertificateTemplatesPage() {
  const [items, setItems] = useState<CertTemplateAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CertTemplateAdminItem | null>(null);
  const [form, setForm] = useState<CertTemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/certificate-templates")
      .then((r) => r.json())
      .then((d) => setItems(d?.templates ?? []))
      .catch((e) => { console.error("Failed to load templates", e); toast.error("Không thể tải mẫu chứng chỉ."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, fields: [] }); setOpen(true); };
  const openEdit = (t: CertTemplateAdminItem) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      svgTemplate: t.svgTemplate,
      backgroundPath: t.backgroundPath ?? null,
      fields: t.fields ?? [],
      isDefault: t.isDefault,
      isActive: t.isActive,
    });
    setOpen(true);
  };

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Ảnh tối đa 10MB"); return; }
    setUploadingBg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/local", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!d?.url) { toast.error(d?.error ?? "Upload thất bại"); return; }
      setForm({ ...form, backgroundPath: d.url });
      toast.success("Đã tải ảnh nền");
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setUploadingBg(false); e.target.value = ""; }
  };

  const addField = () => {
    const usedKeys = (form.fields ?? []).map((f) => f.key);
    const available = CERT_FIELD_KEYS.find((k) => !usedKeys.includes(k.key));
    setForm({ ...form, fields: [...(form.fields ?? []), defaultField(available?.key)] });
  };

  const updateField = (index: number, data: Partial<CertField>) => {
    const fields = [...(form.fields ?? [])];
    fields[index] = { ...fields[index], ...data } as CertField;
    setForm({ ...form, fields });
  };

  const removeField = (index: number) => {
    setForm({ ...form, fields: (form.fields ?? []).filter((_, i) => i !== index) });
  };

  const save = async () => {
    if (!form.title) { toast.error("Nhập tiêu đề"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/certificate-templates/${editing.id}` : "/api/admin/certificate-templates";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(editing ? "Đã cập nhật" : "Đã tạo mẫu"); setOpen(false); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Xóa mẫu chứng chỉ này?")) return;
    try {
      const res = await fetch(`/api/admin/certificate-templates/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Xóa thất bại");
    } catch { toast.error("Lỗi"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Mẫu chứng chỉ</h1><p className="text-muted-foreground">{items.length} mẫu</p></div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm mẫu</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <ScrollText className="mb-3 h-10 w-10" />
            <p>Chưa có mẫu chứng chỉ nào</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>Thêm mẫu đầu tiên</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tiêu đề</TableHead><TableHead>Ảnh nền</TableHead><TableHead>Mặc định</TableHead><TableHead>Kích hoạt</TableHead><TableHead>Đã cấp</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t: CertTemplateAdminItem) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.backgroundPath ? <Badge variant="outline">Có</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{t.isDefault ? <Badge>Mặc định</Badge> : null}</TableCell>
                  <TableCell><Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "Có" : "Không"}</Badge></TableCell>
                  <TableCell>{t._count?.certificates ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
          <DialogHeader><DialogTitle>{editing ? "Sửa mẫu chứng chỉ" : "Thêm mẫu chứng chỉ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

            <div className="space-y-2">
              <Label>Ảnh nền chứng chỉ</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/50">
                  {uploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Chọn ảnh nền
                  <input type="file" accept="image/*" className="hidden" onChange={uploadBackground} disabled={uploadingBg} />
                </label>
                {form.backgroundPath && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setForm({ ...form, backgroundPath: null, fields: [] })}>
                    <Trash2 className="h-4 w-4 mr-1" /> Xoá
                  </Button>
                )}
              </div>
              {form.backgroundPath && (
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted" style={{ maxHeight: 300 }}>
                  <Image src={form.backgroundPath} alt="Background preview" width={800} height={566} className="w-full object-contain" style={{ maxHeight: 300 }} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Tỉ lệ khuyến nghị: 800x566 (A4 landscape). Ảnh nền sẽ làm mờ nhẹ để dễ đọc text.</p>
            </div>

            {form.backgroundPath && (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Vị trí text trên ảnh nền</Label>
                  <Button size="sm" variant="outline" onClick={addField} disabled={(form.fields ?? []).length >= CERT_FIELD_KEYS.length}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Thêm trường
                  </Button>
                </div>
                {(form.fields ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Chưa có trường nào. Bấm "Thêm trường" để thêm text lên chứng chỉ.</p>
                ) : (
                  <div className="space-y-3">
                    {(form.fields ?? []).map((f, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border bg-secondary/20 p-3">
                        <div className="space-y-1 min-w-[140px] flex-1">
                          <Label className="text-xs">Trường dữ liệu</Label>
                          <Select value={f.key} onValueChange={(v) => updateField(i, { key: v as CertField["key"], label: CERT_FIELD_KEYS.find((k) => k.key === v)?.label ?? v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CERT_FIELD_KEYS.map((k) => (
                                <SelectItem key={k.key} value={k.key} disabled={(form.fields ?? []).some((ff, fi) => ff.key === k.key && fi !== i)}>
                                  {k.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 w-16"><Label className="text-xs">X</Label><Input type="number" value={f.x} onChange={(e) => updateField(i, { x: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-1 w-16"><Label className="text-xs">Y</Label><Input type="number" value={f.y} onChange={(e) => updateField(i, { y: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-1 w-16"><Label className="text-xs">Cỡ chữ</Label><Input type="number" value={f.fontSize} onChange={(e) => updateField(i, { fontSize: parseInt(e.target.value) || 12 })} /></div>
                        <div className="space-y-1 w-20"><Label className="text-xs">Màu</Label><Input type="color" value={f.color} onChange={(e) => updateField(i, { color: e.target.value })} className="h-9 p-1" /></div>
                        <div className="space-y-1 w-20"><Label className="text-xs">Căn</Label>
                          <Select value={f.align} onValueChange={(v) => updateField(i, { align: v as CertField["align"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Trái</SelectItem>
                              <SelectItem value="center">Giữa</SelectItem>
                              <SelectItem value="right">Phải</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeField(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Toạ độ X (trái→phải), Y (trên→xuống). Khung 800x566. Dùng màu tương phản với ảnh nền.</p>
              </div>
            )}

            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Cấu hình SVG nâng cao (tuỳ chọn)</summary>
              <div className="mt-2 space-y-1.5">
                <Label>Nội dung SVG</Label>
                <Textarea rows={6} value={form.svgTemplate} onChange={(e) => setForm({ ...form, svgTemplate: e.target.value })} placeholder="<svg>...</svg>" className="font-mono text-xs" />
              </div>
            </details>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
                <Label>Mặc định</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Kích hoạt</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
