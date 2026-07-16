"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW } from "@/lib/orders";
import type { OrderAdminItem } from "@/lib/types";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderAdminItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const pageSize = 20;

  const load = useCallback((st: string, pg: number) => {
    setLoading(true);
    fetch(`/api/admin/orders?status=${st}&page=${pg}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d?.orders ?? []);
        setCounts(d?.statusCounts ?? {});
        setTotal(d?.total ?? 0);
        setTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(status, page); }, [status, page, load, setLoading, setOrders, setCounts, setTotal, setTotalPages]);

  const handleStatusChange = (st: string) => {
    setStatus(st);
    setPage(1);
  };

  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);
  const filters = [{ key: "ALL", label: "Tất cả", count: totalCount }, ...ORDER_STATUS_FLOW.map((s) => ({ key: s, label: ORDER_STATUS_LABELS[s], count: counts[s] ?? 0 }))];

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
        <div><h1 className="font-sans text-2xl font-bold">Quản lý đơn hàng</h1><p className="text-muted-foreground">{formatNumber(totalCount)} đơn hàng</p></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => handleStatusChange(f.key)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", status === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70")}>
            {f.label} <span className="ml-1 opacity-70">({formatNumber(f.count)})</span>
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><Package className="h-10 w-10" /><p>Chưa có đơn hàng nào.</p></div>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Khách hàng</TableHead><TableHead>Sản phẩm</TableHead><TableHead>Tổng tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày đặt</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm font-medium">{o.orderCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          {o.firstItemImage ? <Image src={o.firstItemImage} alt={o.orderCode} fill className="object-cover" unoptimized /> : null}
                        </div>
                        <span className="text-sm text-muted-foreground">{formatNumber(o.itemsCount)} sản phẩm</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatPrice(o.total)}</TableCell>
                    <TableCell><Badge className={cn("border-0", ORDER_STATUS_COLORS[o.status])}>{ORDER_STATUS_LABELS[o.status]}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1.5"><Link href={`/admin/don-hang/${o.id}`}><Eye className="h-4 w-4" /> Xem</Link></Button>
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
