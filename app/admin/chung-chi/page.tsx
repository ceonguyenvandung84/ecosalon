"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CertificateItem } from "@/lib/types";

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetch(`/api/admin/certificates?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d?.certificates ?? []);
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load, setLoading, setItems, setTotal, setTotalPages]);

  const doSearch = () => { setPage(1); load(search, 1); };

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

  const toggleRevoke = async (c: CertificateItem) => {
    const action = c.isRevoked ? "khôi phục" : "thu hồi";
    if (!confirm(`${action === "thu hồi" ? "Thu hồi" : "Khôi phục"} chứng chỉ này?`)) return;
    try {
      const res = await fetch(`/api/admin/certificates/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRevoked: !c.isRevoked }),
      });
      if (res.ok) { toast.success(`Đã ${action}`); load(search, page); }
      else toast.error("Thất bại");
    } catch { toast.error("Lỗi"); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Quản lý chứng chỉ</h1><p className="text-muted-foreground">{formatNumber(total)} chứng chỉ</p></div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên học viên, khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={doSearch}>Tìm kiếm</Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <FileCheck className="mb-3 h-10 w-10" />
            <p>Chưa có chứng chỉ nào</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã chứng chỉ</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Ngày cấp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-medium">{c.certificateNumber}</TableCell>
                    <TableCell>{c.studentName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.courseTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(c.issueDate).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      {c.isRevoked ? (
                        <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Đã thu hồi</Badge>
                      ) : (
                        <Badge variant="default"><FileCheck className="mr-1 h-3 w-3" /> Còn hiệu lực</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={c.isRevoked ? "outline" : "destructive"} onClick={() => toggleRevoke(c)}>
                        {c.isRevoked ? "Khôi phục" : "Thu hồi"}
                      </Button>
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
