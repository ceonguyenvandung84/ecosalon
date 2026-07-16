"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Loader2, History, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; role: string; avatarPath: string | null };
}

export default function ActivityLogPage() {

  const [items, setItems] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/admin/activity-log?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 0);
    setLoading(false);
  }, [page, entityFilter, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs, setLoading, setItems, setTotal, setTotalPages]);

  const actionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return <Badge className={colors[action] ?? "bg-slate-100 text-slate-700"} variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" />
          <h1 className="font-sans text-xl font-bold">Lịch sử hoạt động</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tổng số: {total}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Đối tượng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Course">Khóa học</SelectItem>
                  <SelectItem value="Product">Sản phẩm</SelectItem>
                  <SelectItem value="Order">Đơn hàng</SelectItem>
                  <SelectItem value="User">Người dùng</SelectItem>
                  <SelectItem value="Category">Danh mục</SelectItem>
                  <SelectItem value="Certificate">Chứng chỉ</SelectItem>
                  <SelectItem value="ForumThread">Chủ đề diễn đàn</SelectItem>
                  <SelectItem value="ForumReply">Trả lời diễn đàn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Hành động" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="CREATE">Tạo</SelectItem>
                  <SelectItem value="UPDATE">Sửa</SelectItem>
                  <SelectItem value="DELETE">Xóa</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => { setEntityFilter(""); setActionFilter(""); setPage(1); }}>Xóa lọc</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Người dùng</TableHead>
                <TableHead className="w-20">Hành động</TableHead>
                <TableHead className="w-28">Đối tượng</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead className="w-36 text-right">Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Chưa có hoạt động nào.</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={item.user.avatarPath ?? undefined} />
                        <AvatarFallback className="text-xs">{item.user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.user.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{actionBadge(item.action)}</TableCell>
                  <TableCell><Badge variant="secondary">{item.entity}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{item.detail ?? item.entityId ?? "—"}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
