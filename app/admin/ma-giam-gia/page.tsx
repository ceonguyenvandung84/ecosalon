"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { toast } from "sonner";
import { formatNumber, cn } from "@/lib/utils";
import type { CouponAdminItem, CouponForm } from "@/lib/types";

const emptyForm = {
  code: "",
  label: "",
  type: "PERCENT" as "PERCENT" | "FIXED_AMOUNT",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  courseIds: [] as string[],
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [items, setItems] = useState<CouponAdminItem[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CouponAdminItem | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  const load = useCallback((q?: string, pg?: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg ?? page), pageSize: String(pageSize) });
    const query = q ?? search;
    if (query) params.set("search", query);
    Promise.all([
      fetch(`/api/admin/coupons?${params}`).then((r) => r.json()).then((d) => { setItems(d?.coupons ?? []); setTotal(d?.total ?? 0); setTotalPages(d?.totalPages ?? 0); }),
      fetch("/api/admin/courses").then((r) => r.json()).then((d) => setCourses(d?.courses ?? [])),
    ]).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load, page, setLoading, setItems, setCourses, setTotal, setTotalPages]);

  const openNew = () => {
    setEditing(null);
    const today = new Date().toISOString().split("T")[0] ?? "";
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ?? "";
    setForm({ ...emptyForm, startsAt: today, expiresAt: nextMonth });
    setOpen(true);
  };

  const openEdit = (c: CouponAdminItem) => {
    setEditing(c);
    setForm({
      code: c.code,
      label: c.label ?? "",
      type: c.type,
      value: String(c.value),
      minOrderAmount: String(c.minOrderAmount ?? 0),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: String(c.usageLimit ?? 0),
      courseIds: c.courseIds ?? [],
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().split("T")[0]! : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0]! : "",
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) { toast.error("Vui lòng nhập mã coupon"); return; }
    if (!form.value || Number(form.value) <= 0) { toast.error("Giá trị phải lớn hơn 0"); return; }
    if (!form.startsAt || !form.expiresAt) { toast.error("Vui lòng chọn ngày bắt đầu và hết hạn"); return; }
    if (new Date(form.expiresAt) <= new Date(form.startsAt)) { toast.error("Ngày hết hạn phải sau ngày bắt đầu"); return; }

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        label: form.label || null,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit) || 0,
        courseIds: form.courseIds,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      };

      const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) { toast.error(d?.error || "Lưu thất bại"); return; }
      toast.success(editing ? "Đã cập nhật" : "Đã tạo mã giảm giá");
      setOpen(false);
      load(search, page);
    } catch { toast.error("Lỗi server"); }
    finally { setSaving(false); }
  };

  const remove = async (c: CouponAdminItem) => {
    if (!confirm(`Xóa mã "${c.code}"?`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(search, page); }
    else toast.error("Xóa thất bại");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const isExpired = (coupon: CouponAdminItem) => new Date(coupon.expiresAt) < new Date();
  const isUpcoming = (coupon: CouponAdminItem) => new Date(coupon.startsAt) > new Date();

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Mã giảm giá</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo và quản lý mã giảm giá cho khóa học.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Tạo mã mới</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input placeholder="Tìm theo mã, tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button type="submit" size="sm">Tìm kiếm</Button>
        </form>
        <p className="text-sm text-muted-foreground">{formatNumber(total)} mã giảm giá</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center py-20 rounded-xl border border-dashed text-muted-foreground">
          <Tag className="mb-3 h-10 w-10" />
          <p>Chưa có mã giảm giá nào</p>
          <Button variant="outline" className="mt-4" onClick={openNew}>Tạo mã đầu tiên</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Đã dùng</TableHead>
                <TableHead>Hiệu lực</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c: CouponAdminItem) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold">{c.code}</span>
                      {c.label ? <span className="text-xs text-muted-foreground">{c.label}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.type === "PERCENT" ? "Phần trăm" : "Số tiền"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {c.type === "PERCENT" ? `${c.value}%` : `${formatNumber(c.value)}đ`}
                      </span>
                      {c.maxDiscount ? <span className="text-xs text-muted-foreground">Tối đa {formatNumber(c.maxDiscount)}đ</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.usageLimit > 0
                      ? <span>{c.usedCount}/{c.usageLimit}</span>
                      : <span className="text-muted-foreground">Không giới hạn</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>Từ: {new Date(c.startsAt).toLocaleDateString("vi-VN")}</span>
                      <span>Đến: {new Date(c.expiresAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired(c) ? (
                      <Badge variant="secondary">Đã hết hạn</Badge>
                    ) : isUpcoming(c) ? (
                      <Badge variant="secondary">Chưa bắt đầu</Badge>
                    ) : c.isActive ? (
                      <Badge>Đang hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Tắt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {formatNumber(total)}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={cn(page <= 1 && "pointer-events-none opacity-50")} />
                    </PaginationItem>
                    {getPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={page === p} onClick={() => setPage(p)}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={cn(page >= totalPages && "pointer-events-none opacity-50")} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader><DialogTitle>{editing ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã coupon *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                  placeholder="VD: SUMMER2025"
                  className="font-mono"
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label>Loại *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "PERCENT" | "FIXED_AMOUNT" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Số tiền cố định (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nhãn (nội bộ)</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="VD: Summer sale 2025" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === "PERCENT" ? "10" : "50000"}
                />
              </div>
              {form.type === "PERCENT" && (
                <div className="space-y-2">
                  <Label>Giảm tối đa (VND)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="100000"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn hàng tối thiểu (VND)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Số lần sử dụng tối đa</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="0 = không giới hạn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu *</Label>
                <Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ngày hết hạn *</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Áp dụng cho khóa học</Label>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có khóa học nào.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                  {courses.map((course) => (
                    <label key={course.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes(course.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, courseIds: [...form.courseIds, course.id] });
                          } else {
                            setForm({ ...form, courseIds: form.courseIds.filter((id: string) => id !== course.id) });
                          }
                        }}
                      />
                      <span className="line-clamp-1">{course.title}</span>
                    </label>
                  ))}
                </div>
              )}
              {form.courseIds.length === 0 && <p className="text-xs text-muted-foreground">Để trống = áp dụng cho tất cả khóa học.</p>}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Đang hoạt động</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Tạo mã giảm giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}