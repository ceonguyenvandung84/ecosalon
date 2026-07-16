"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

import type { BrandAdminItem, BrandForm } from "@/lib/types";

export default function AdminBrandsPage() {
  const [items, setItems] = useState<BrandAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandAdminItem | null>(null);
  const [form, setForm] = useState<BrandForm>({ name: "", slug: "", description: "", logoPath: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => setItems(d?.brands ?? []))
      .catch((e) => { console.error("Failed to load brands", e); toast.error("Không thể tải thương hiệu."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", logoPath: "" });
    setOpen(true);
  };

  const openEdit = (b: BrandAdminItem) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, description: b.description ?? "", logoPath: b.logoPath ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast.error("Nhập tên thương hiệu"); return; }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.name);
      const payload = { ...form, slug };

      let res;
      if (editing) {
        res = await fetch("/api/admin/brands", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editing ? "Đã cập nhật" : "Đã tạo thương hiệu");
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
    if (!confirm("Xóa thương hiệu này?")) return;
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa"); load(); }
      else toast.error("Xóa thất bại");
    } catch { toast.error("Lỗi"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Quản lý thương hiệu</h1><p className="text-muted-foreground">{items.length} thương hiệu</p></div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm thương hiệu</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <p>Chưa có thương hiệu nào</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>Thêm thương hiệu đầu tiên</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tên</TableHead><TableHead>Slug</TableHead><TableHead>Số sản phẩm</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b: BrandAdminItem) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{b.slug}</TableCell>
                  <TableCell><Badge variant="secondary">{b._count?.products ?? 0}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tên *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} /></div>
            <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Logo URL</Label><Input value={form.logoPath} onChange={(e) => setForm((f) => ({ ...f, logoPath: e.target.value }))} /></div>
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
