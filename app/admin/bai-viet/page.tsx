"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ImageIcon, Tag, FolderPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import type { BlogPostItem, BlogCategoryItem, BlogCommentItem, BlogForm } from "@/lib/types";

const empty: BlogForm = { title: "", excerpt: "", content: "", categoryId: "", coverImage: "", isPublished: true, isFeatured: false };

export default function AdminBlogPage() {
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [comments, setComments] = useState<BlogCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPostItem | null>(null);
  const [form, setForm] = useState<BlogForm>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  const load = (q?: string, pg?: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    const query = q ?? search;
    const p = pg ?? page;
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    if (query) params.set("search", query);
    Promise.all([
      fetch(`/api/admin/blog?${params}`).then((r) => r.json()).then((d) => { setPosts(d?.posts ?? []); setTotal(d?.total ?? 0); setTotalPages(d?.totalPages ?? 0); }).catch(() => setPosts([])),
      fetch("/api/admin/blog-categories").then((r) => r.json()).then((d) => setCategories(d?.categories ?? [])).catch(() => setCategories([])),
      fetch("/api/admin/blog-comments").then((r) => r.json()).then((d) => setComments(d?.comments ?? [])).catch(() => setComments([])),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, setPosts, setTotal, setTotalPages, setCategories, setComments, setLoading]);

  const toggleComment = async (id: string, isHidden: boolean) => {
    const res = await fetch("/api/admin/blog-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isHidden }),
    });
    if (res.ok) { toast.success(isHidden ? "Đã ẩn bình luận" : "Đã hiện bình luận"); load(); }
    else toast.error("Thất bại");
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Xóa bình luận này?")) return;
    const res = await fetch(`/api/admin/blog-comments?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); }
    else toast.error("Xóa thất bại");
  };

  const openNew = () => { setEditing(null); setForm({ ...empty, categoryId: categories?.[0]?.id ?? "" }); setOpen(true); };
  const openEdit = async (p: BlogPostItem) => {
    try {
      const res = await fetch(`/api/admin/blog/${p.id}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      const post = d?.post ?? p;
      setEditing(post);
      setForm({ title: post.title, excerpt: post.excerpt, content: post.content, categoryId: post.categoryId ?? "", coverImage: post.coverImage ?? "", isPublished: post.isPublished, isFeatured: post.isFeatured });
      setOpen(true);
    } catch {
      toast.error("Không thể tải bài viết");
    }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh tối đa 5MB"); return; }
    setUploading(true);
    try {
      const res = await fetch("/api/upload/presigned", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) });
      const d = await res.json();
      if (!d?.uploadUrl) throw new Error();
      const put = await fetch(d.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error();
      setForm((f) => ({ ...f, coverImage: d.cloud_storage_path }));
      toast.success("Đã tải ảnh bìa");
    } catch { toast.error("Tải ảnh thất bại"); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Vui lòng nhập tiêu đề và nội dung"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Đã cập nhật" : "Đã tạo bài viết");
      setOpen(false);
      load(search, page);
    } catch { toast.error("Lưu thất bại"); } finally { setSaving(false); }
  };

  const remove = async (p: BlogPostItem) => {
    if (!confirm(`Xóa bài viết "${p.title}"?`)) return;
    const res = await fetch(`/api/admin/blog/${p.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Xóa thất bại");
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const res = await fetch("/api/admin/blog-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCat }) });
    if (res.ok) { toast.success("Đã thêm chuyên mục"); setNewCat(""); setCatOpen(false); load(); } else toast.error("Thất bại");
  };
  const removeCategory = async (c: BlogCategoryItem) => {
    if (!confirm(`Xóa chuyên mục "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/blog-categories/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa"); load(); } else toast.error("Thất bại");
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

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Quản lý bài viết</h1>
          <p className="text-sm text-muted-foreground">Tạo và quản lý bài viết, kinh nghiệm cho cộng đồng.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Bài viết mới</Button>
      </div>

      <Tabs defaultValue="posts" className="mt-6">
        <TabsList>
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="categories">Chuyên mục</TabsTrigger>
          <TabsTrigger value="comments">Bình luận</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input placeholder="Tìm theo tiêu đề..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Button type="submit" size="sm">Tìm kiếm</Button>
            </form>
            <p className="text-sm text-muted-foreground">{formatNumber(total)} bài viết</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Chuyên mục</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Lượt xem</TableHead>
                    <TableHead>Ngày đăng</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-[280px] font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{p.title}</span>
                          {p.isFeatured && <Badge variant="secondary">Nổi bật</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{p.category?.name ?? "—"}</TableCell>
                      <TableCell>{p.isPublished ? <Badge className="bg-green-100 text-green-700">Đã đăng</Badge> : <Badge variant="secondary">Bản nháp</Badge>}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.viewCount)}</TableCell>
                      <TableCell>{formatDate(p.publishedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Chưa có bài viết nào.</TableCell></TableRow>}
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
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="mb-4 flex justify-end"><Button variant="outline" onClick={() => setCatOpen(true)}><FolderPlus className="mr-2 h-4 w-4" /> Thêm chuyên mục</Button></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /><span className="font-medium">{c.name}</span></div>
                <Button variant="ghost" size="icon" onClick={() => removeCategory(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">Chưa có chuyên mục.</p>}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground">
              <MessageSquare className="mb-3 h-10 w-10" />
              <p>Chưa có bình luận nào</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Bài viết</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.user?.fullName ?? "Ẩn danh"}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{c.content}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{c.post?.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={c.isHidden ? "secondary" : "default"}>{c.isHidden ? "Đã ẩn" : "Hiển thị"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleComment(c.id, !c.isHidden)}>{c.isHidden ? "Hiện" : "Ẩn"}</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteComment(c.id)}>Xóa</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Post dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader><DialogTitle>{editing ? "Sửa bài viết" : "Bài viết mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tiêu đề</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tóm tắt</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Để trống sẽ tự lấy từ nội dung" /></div>
            <div className="space-y-2"><Label>Nội dung</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chuyên mục</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không phân loại</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ảnh bìa</Label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-secondary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {form.coverImage ? "Đã có ảnh — đổi ảnh" : "Tải ảnh lên"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploading} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2"><Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} /><Label>Đăng ngay</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /><Label>Nổi bật</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Thêm chuyên mục</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Tên chuyên mục</Label><Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="VD: Xu hướng tóc" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Hủy</Button>
            <Button onClick={addCategory}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
