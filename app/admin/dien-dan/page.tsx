"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Trash2, Pin, PinOff, Lock, Unlock, Eye, EyeOff,
  FolderPlus, MessagesSquare, Search, Flag, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import type { ForumThreadItem, ForumCategoryItem } from "@/lib/types";

const bannedWords = [
  { word: "spam", severity: "Cao" },
  { word: "xxx", severity: "Cao" },
  { word: "quảng cáo trái phép", severity: "Trung bình" },
];

function ForumInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "threads";

  const [threads, setThreads] = useState<ForumThreadItem[]>([]);
  const [categories, setCategories] = useState<ForumCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [savingCat, setSavingCat] = useState(false);
  const [blockWord, setBlockWord] = useState("");
  const [blockedWords, setBlockedWords] = useState(bannedWords);

  const loadThreads = (q = "", pg = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), pageSize: String(pageSize) });
    if (q) params.set("search", q);
    fetch(`/api/admin/forum/threads?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setThreads(d?.threads ?? []);
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch((e) => { console.error("Failed to load threads", e); toast.error("Không thể tải bài đăng."); })
      .finally(() => setLoading(false));
  };
  const loadCategories = () => {
    fetch("/api/admin/forum-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d?.categories ?? []))
      .catch((e) => { console.error("Failed to load forum categories", e); toast.error("Không thể tải chuyên mục."); });
  };
  useEffect(() => {
    if (tab === "threads") loadThreads(search, page);
    if (tab === "categories") loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, search]);

  const patchThread = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/forum/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã cập nhật chủ đề");
      loadThreads(search, page);
    } catch {
      toast.error("Không thể cập nhật chủ đề");
    }
  };

  const deleteThread = async (id: string) => {
    if (!confirm("Xóa chủ đề này và toàn bộ trả lời?")) return;
    try {
      const res = await fetch(`/api/admin/forum/threads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa chủ đề");
      loadThreads(search, page);
      loadCategories();
    } catch {
      toast.error("Không thể xóa chủ đề");
    }
  };

  const addCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error("Vui lòng nhập tên chuyên mục");
      return;
    }
    setSavingCat(true);
    try {
      const res = await fetch("/api/admin/forum-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã thêm chuyên mục");
      setCatOpen(false);
      setCatForm({ name: "", description: "" });
      loadCategories();
    } catch {
      toast.error("Không thể thêm chuyên mục");
    } finally {
      setSavingCat(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Xóa chuyên mục này? Các chủ đề bên trong cũng sẽ bị xóa.")) return;
    try {
      const res = await fetch(`/api/admin/forum-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa chuyên mục");
      loadCategories();
      loadThreads(search, page);
    } catch {
      toast.error("Không thể xóa chuyên mục");
    }
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

  const setTab = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "threads") params.delete("tab");
    else params.set("tab", v);
    router.replace(`/admin/dien-dan${params.toString() ? "?" + params.toString() : ""}`);
  };

  const addBlockedWord = () => {
    if (!blockWord.trim()) return;
    setBlockedWords((prev) => [...prev, { word: blockWord.trim(), severity: "Trung bình" }]);
    setBlockWord("");
    toast.success("Đã thêm từ khóa chặn");
  };

  const removeBlockedWord = (word: string) => {
    setBlockedWords((prev) => prev.filter((w) => w.word !== word));
    toast.success("Đã xóa từ khóa chặn");
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessagesSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-bold">Quản lý cộng đồng</h1>
          <p className="text-sm text-muted-foreground">Kiểm duyệt chủ đề, quản lý chuyên mục và xử lý vi phạm</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="threads" className="gap-2"><MessagesSquare className="h-4 w-4" /> Chủ đề</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><FolderPlus className="h-4 w-4" /> Chuyên mục</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><Flag className="h-4 w-4" /> Vi phạm & Từ khóa</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="mt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              loadThreads(search, 1);
            }}
            className="mb-4 flex gap-2"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>

          <div className="rounded-xl border bg-card shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : threads.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Chưa có chủ đề nào.</p>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chủ đề</TableHead>
                    <TableHead>Chuyên mục</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead className="text-center">Trả lời</TableHead>
                    <TableHead className="text-center">Lượt xem</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threads.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-[260px]">
                        <a
                          href={`/dien-dan/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-2 font-medium hover:text-primary"
                        >
                          {t.title}
                        </a>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.category?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{t.author?.name ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(t.replyCount ?? 0)}</TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(t.viewCount ?? 0)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {t.isPinned && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Ghim</Badge>}
                          {t.isLocked && <Badge variant="secondary">Khóa</Badge>}
                          {t.isHidden && <Badge variant="destructive">Ẩn</Badge>}
                          {!t.isPinned && !t.isLocked && !t.isHidden && (
                            <span className="text-xs text-muted-foreground">Bình thường</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t.isPinned ? "Bỏ ghim" : "Ghim"}
                            onClick={() => patchThread(t.id, { isPinned: !t.isPinned })}
                          >
                            {t.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t.isLocked ? "Mở khóa" : "Khóa"}
                            onClick={() => patchThread(t.id, { isLocked: !t.isLocked })}
                          >
                            {t.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t.isHidden ? "Hiện" : "Ẩn"}
                            onClick={() => patchThread(t.id, { isHidden: !t.isHidden })}
                          >
                            {t.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Xóa"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteThread(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setCatOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" /> Thêm chuyên mục
            </Button>
          </div>
          <div className="rounded-xl border bg-card shadow-sm">
            {categories.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Chưa có chuyên mục nào.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chuyên mục</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Số chủ đề</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                        <span className="line-clamp-2">{c.description || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{formatNumber(c._count?.threads ?? 0)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteCategory(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Flag className="h-5 w-5 text-destructive" /> Báo cáo vi phạm</h2>
              <p className="text-sm text-muted-foreground mb-4">Danh sách báo cáo từ người dùng về nội dung vi phạm.</p>
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Chưa có báo cáo vi phạm nào.
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Ban className="h-5 w-5 text-destructive" /> Từ khóa chặn</h2>
              <p className="text-sm text-muted-foreground mb-4">Quản lý từ khóa cấm trong nội dung diễn đàn.</p>
              <div className="flex gap-2 mb-4">
                <Input value={blockWord} onChange={(e) => setBlockWord(e.target.value)} placeholder="Nhập từ khóa cần chặn..." />
                <Button onClick={addBlockedWord}><Ban className="h-4 w-4 mr-1" /> Thêm</Button>
              </div>
              {blockedWords.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có từ khóa nào.</p>
              ) : (
                <div className="space-y-2">
                  {blockedWords.map((w) => (
                    <div key={w.word} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{w.word}</span>
                        <Badge variant={w.severity === "Cao" ? "destructive" : "secondary"} className="text-[10px]">{w.severity}</Badge>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeBlockedWord(w.word)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm chuyên mục diễn đàn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên chuyên mục</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="VD: Thảo luận chung"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="Mô tả ngắn về chuyên mục"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Hủy</Button>
            <Button onClick={addCategory} disabled={savingCat}>
              {savingCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminForumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ForumInner />
    </Suspense>
  );
}
