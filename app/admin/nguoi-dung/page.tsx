"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserCheck, UserX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatNumber, cn } from "@/lib/utils";
import type { UserAdminItem } from "@/lib/types";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d?.users ?? []);
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [page, role, search]);

  useEffect(() => { load(); }, [load, setLoading, setItems, setTotal, setTotalPages]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const update = async (id: string, body: Partial<{ role: string; isActive: boolean }>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { toast.success("Đã cập nhật"); load(); } else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Lỗi"); }
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
      <h1 className="font-sans text-2xl font-bold">Quản lý người dùng</h1>
      <p className="text-muted-foreground">{formatNumber(total)} người dùng</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm theo tên, email..." value={search} onChange={(e) => setSearchInput(e.target.value)} className="w-64 pl-9" />
          </div>
          <Button type="submit" size="sm">Tìm kiếm</Button>
        </form>
        <Select value={role} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả vai trò" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
            <SelectItem value="USER">Học viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><p>Không tìm thấy người dùng.</p></div>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Họ tên</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>KH</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((u: UserAdminItem) => (
                  <TableRow key={u?.id}>
                    <TableCell className="font-medium">{u?.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{u?.email}</TableCell>
                    <TableCell>
                        <Select value={u?.role || "USER"} onValueChange={(v) => { if (!confirm("Bạn có chắc muốn thay đổi vai trò của người dùng này?")) return; update(u?.id, { role: v }); }}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Học viên</SelectItem>
                            <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    <TableCell>{formatNumber(u?.enrollmentsCount)}</TableCell>
                    <TableCell><Badge variant={u?.isActive ? "default" : "secondary"} className={u?.isActive ? "" : "bg-destructive text-destructive-foreground"}>{u?.isActive ? "Hoạt động" : "Khóa"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => { if (!confirm("Bạn có chắc muốn khóa/mở khóa tài khoản này?")) return; update(u?.id, { isActive: !u?.isActive }); }}>{u?.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}{u?.isActive ? "Khóa" : "Mở"}</Button>
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
    </div>
  );
}
