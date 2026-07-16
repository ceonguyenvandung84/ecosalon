"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CategoryAdminItem, CategoryForm } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdminItem | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: "", type: "COURSE" as "COURSE" | "PRODUCT", icon: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setItems(d?.categories ?? []))
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", type: "COURSE", icon: "", description: "" });
    setOpen(true);
  };

  const openEdit = (c: CategoryAdminItem) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, icon: c.icon ?? "", description: c.description ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast.error("Nhập tên danh mục"); return; }
    setSaving(true);
    try {
      let res;
      if (editing) {
        res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      if (res.ok) {
        toast.success(editing ? "Đã cập nhật" : "Đã tạo danh mục");
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
    if (!confirm("Xóa danh mục này?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa"); load(); }
      else {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? "Xóa thất bại");
      }
    } catch { toast.error("Lỗi"); }
  };

  const typeLabel = (t: string) => t === "COURSE" ? "Khóa học" : "Sản phẩm";
  const typeColor = (t: string) => t === "COURSE" ? "default" : "secondary";

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Quản lý danh mục</h1><p className="text-muted-foreground">{items.length} danh mục</p></div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm danh mục</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <FolderTree className="mb-3 h-10 w-10" />
            <p>Chưa có danh mục nào</p>
            <Button variant="outline" className="mt-4" onClick={openNew}>Thêm danh mục đầu tiên</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tên</TableHead><TableHead>Slug</TableHead><TableHead>Loại</TableHead><TableHead>Khóa học</TableHead><TableHead>Sản phẩm</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c: CategoryAdminItem) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.icon ? `${c.icon} ` : ""}{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.slug}</TableCell>
                  <TableCell><Badge variant={typeColor(c.type)}>{typeLabel(c.type)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{c._count?.courses ?? 0}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{c._count?.products ?? 0}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tên *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Loại *</Label>
              <Select value={form.type} onValueChange={(v: "COURSE" | "PRODUCT") => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COURSE">Khóa học</SelectItem>
                  <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="VD: 📚" /></div>
            <div className="space-y-1.5"><Label>Mô tả</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
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
