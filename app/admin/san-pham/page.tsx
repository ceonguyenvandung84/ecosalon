"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductListItem, ProductForm, CategoryAdminItem, BrandAdminItem } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { formatPrice, formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";

const empty = { title: "", shortDesc: "", description: "", price: "", discountPercent: "", stock: "", sku: "", images: [] as string[], categoryId: "", brandId: "", isFeatured: false, isPublished: true };

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [cats, setCats] = useState<CategoryAdminItem[]>([]);
  const [brands, setBrands] = useState<BrandAdminItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback((pg: number) => {
    setPageLoading(true);
    const params = new URLSearchParams({ page: String(pg), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d?.products ?? []);
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setPageLoading(false));
  }, [search, categoryId]);
  useEffect(() => {
    load(1);
    fetch("/api/categories?type=PRODUCT").then((r) => r.json()).then((d) => setCats(d?.categories ?? [])).catch((e) => { console.error("Failed to load categories", e); toast.error("Không thể tải danh mục sản phẩm."); });
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(d?.brands ?? [])).catch((e) => { console.error("Failed to load brands", e); toast.error("Không thể tải thương hiệu."); });
  }, [load, setCats, setBrands, setPageLoading, setItems, setTotal, setTotalPages]);

  useEffect(() => { load(page); }, [load, page, setPageLoading, setItems, setTotal, setTotalPages]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
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

  const openNew = () => { setEditing(null); setForm({ ...empty }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.categoryId) { toast.error("Nhập tiêu đề và danh mục"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
      const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(editing ? "Đã cập nhật" : "Đã tạo sản phẩm"); setOpen(false); load(page); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    try { const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" }); if (res.ok) { toast.success("Đã xóa"); load(page); } else toast.error("Xóa thất bại"); } catch { toast.error("Lỗi"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Quản lý sản phẩm</h1><p className="text-muted-foreground">{formatNumber(total)} sản phẩm</p></div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=products" download className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </a>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Thêm sản phẩm</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input placeholder="Tìm theo tên sản phẩm..." value={search} onChange={(e) => setSearchInput(e.target.value)} className="w-64" />
          <Button type="submit" size="sm">Tìm kiếm</Button>
        </form>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {(cats ?? []).map((c) => <SelectItem key={c?.id} value={c?.id}>{c?.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {pageLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><p>Không tìm thấy sản phẩm.</p></div>
        ) : (
          <>
            <Table>
          <TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Danh mục</TableHead><TableHead>Giá</TableHead><TableHead>Kho</TableHead><TableHead>Đã bán</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {(items ?? []).map((p) => (
              <TableRow key={p?.id}>
                <TableCell className="max-w-[240px] font-medium">{p?.title}{p?.isFeatured ? <Badge className="ml-2" variant="secondary">Nổi bật</Badge> : null}</TableCell>
                <TableCell>{p?.category}</TableCell>
                <TableCell>{formatPrice(p?.price)}{(p?.discountPercent ?? 0) > 0 ? <span className="ml-1 text-xs text-destructive">-{p?.discountPercent}%</span> : null}</TableCell>
                <TableCell>{formatNumber(p?.stock)}</TableCell>
                <TableCell>{formatNumber(p?.soldCount)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/san-pham/${p?.id}`}><Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button></Link>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(p?.id)}><Trash2 className="h-4 w-4" /></Button>
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
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tên *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả ngắn</Label><Input value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Mô tả chi tiết</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Hình ảnh</Label>
              <div className="flex flex-wrap gap-2">
                {(form.images ?? []).map((img: string, i: number) => (
                  <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
                    <Image src={img} alt={`Ảnh ${i+1}`} fill className="object-cover" sizes="64px" />
                    <button className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs" onClick={() => setForm((f) => ({ ...f, images: (f.images ?? []).filter((_, idx: number) => idx !== i) }))}><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted hover:bg-secondary/50">
                  <span className="text-xs text-muted-foreground">+</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    if (file.size > 5*1024*1024) { toast.error("Ảnh tối đa 5MB"); return; }
                    try {
                      const res = await fetch("/api/upload/presigned", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) });
                      const d = await res.json();
                      if (!d?.uploadUrl) { toast.error("Không thể tải lên"); return; }
                      await fetch(d.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                      setForm((f) => ({ ...f, images: [...(f.images ?? []), d.cloud_storage_path] }));
                      toast.success("Đã tải ảnh lên");
                    } catch { toast.error("Lỗi tải ảnh"); }
                  }} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Giá</Label><Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>KM %</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Kho</Label><Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Mã SKU</Label><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="VD: SP001" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Danh mục *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}><SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger><SelectContent>{(cats ?? []).map((c) => <SelectItem key={c?.id} value={c?.id}>{c?.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Thương hiệu</Label>
                <Select value={form.brandId} onValueChange={(v) => setForm((f) => ({ ...f, brandId: v }))}><SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger><SelectContent>{(brands ?? []).map((b) => <SelectItem key={b?.id} value={b?.id}>{b?.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch id="pFeatured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} /><Label htmlFor="pFeatured">Nổi bật</Label></div>
              <div className="flex items-center gap-2"><Switch id="pPublished" checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} /><Label htmlFor="pPublished">Hiển thị</Label></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
