"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Application {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  bio: string | null;
  expertise: string[];
  experience: string | null;
  motivation: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user?: { id: string; email: string; fullName: string; avatar: string | null };
}

export default function InstructorApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  const [detail, setDetail] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusFilter });
    fetch(`/api/admin/instructor-applications?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d?.applications ?? []);
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/instructor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(action === "APPROVE" ? "Đã duyệt đơn!" : "Đã từ chối đơn.");
        setDetail(null);
        setAdminNote("");
        load();
      } else {
        toast.error(d?.error || "Thất bại");
      }
    } catch { toast.error("Lỗi"); }
    finally { setActionLoading(false); }
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
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-bold">Ứng viên Giảng viên</h1>
          <p className="text-muted-foreground">{formatNumber(total)} đơn đăng ký</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" variant={statusFilter === "PENDING" ? "default" : "outline"} onClick={() => { setStatusFilter("PENDING"); setPage(1); }}>
          <Clock className="h-4 w-4 mr-1" /> Chờ duyệt
        </Button>
        <Button size="sm" variant={statusFilter === "APPROVED" ? "default" : "outline"} onClick={() => { setStatusFilter("APPROVED"); setPage(1); }}>
          <CheckCircle className="h-4 w-4 mr-1" /> Đã duyệt
        </Button>
        <Button size="sm" variant={statusFilter === "REJECTED" ? "default" : "outline"} onClick={() => { setStatusFilter("REJECTED"); setPage(1); }}>
          <XCircle className="h-4 w-4 mr-1" /> Đã từ chối
        </Button>
        <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => { setStatusFilter("all"); setPage(1); }}>
          Tất cả
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <GraduationCap className="h-10 w-10 opacity-20" />
              <p>Không có đơn nào.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Ngày nộp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.fullName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.expertise?.slice(0, 2).join(", ")}{a.expertise?.length > 2 ? "..." : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === "PENDING" ? "secondary" : a.status === "APPROVED" ? "default" : "destructive"}>
                        {a.status === "PENDING" ? "Chờ duyệt" : a.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetail(a)}>Xem chi tiết</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>

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
                p === "..." ? <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem> :
                  <PaginationItem key={p}><PaginationLink isActive={page === p} onClick={() => setPage(p)}>{p}</PaginationLink></PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={cn(page >= totalPages && "pointer-events-none opacity-50")} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => { setDetail(null); setAdminNote(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn ứng tuyển</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{detail.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detail.email}</p>
                </div>
              </div>

              {detail.expertise && detail.expertise.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Chuyên môn</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detail.expertise.map((e, i) => <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>)}
                  </div>
                </div>
              )}

              {detail.bio && (
                <div>
                  <p className="text-xs text-muted-foreground">Giới thiệu bản thân</p>
                  <p className="text-sm mt-0.5">{detail.bio}</p>
                </div>
              )}

              {detail.experience && (
                <div>
                  <p className="text-xs text-muted-foreground">Kinh nghiệm</p>
                  <p className="text-sm mt-0.5">{detail.experience}</p>
                </div>
              )}

              {detail.motivation && (
                <div>
                  <p className="text-xs text-muted-foreground">Lý do</p>
                  <p className="text-sm mt-0.5">{detail.motivation}</p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <Label>Ghi chú (tùy chọn)</Label>
                <Textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Lý do duyệt/từ chối..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDetail(null); setAdminNote(""); }}>Đóng</Button>
            {detail?.status === "PENDING" && (
              <>
                <Button variant="destructive" onClick={() => handleAction(detail.id, "REJECT")} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Từ chối
                </Button>
                <Button onClick={() => handleAction(detail.id, "APPROVE")} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Duyệt
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}