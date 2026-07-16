"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Eye, Megaphone, Check, X, Ban, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import {
  AFFILIATE_STATUS_LABELS, AFFILIATE_STATUS_COLORS,
  PAYOUT_STATUS_LABELS, PAYOUT_STATUS_COLORS,
} from "@/lib/affiliate";
import { toast } from "sonner";
import type { AffiliateItem, PayoutItem } from "@/lib/types";

function AffiliatesTab() {
  const [items, setItems] = useState<AffiliateItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");

  const load = useCallback((st: string) => {
    setLoading(true);
    fetch(`/api/admin/affiliates?status=${st}`)
      .then((r) => r.json())
      .then((d) => { setItems(d?.affiliates ?? []); setCounts(d?.statusCounts ?? {}); })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, []);
  const updateStatus = async (id: string, newStatus: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { toast.success("Đã cập nhật"); load(status); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Lỗi"); } finally { setBusy(""); }
  };

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const filters = [{ key: "ALL", label: "Tất cả", count: total }, ...["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => ({ key: s, label: AFFILIATE_STATUS_LABELS[s], count: counts[s] ?? 0 }))];

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", status === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70")}>
            {f.label} <span className="ml-1 opacity-70">({formatNumber(f.count)})</span>
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><Megaphone className="h-10 w-10" /><p>Chưa có đối tác nào.</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Đối tác</TableHead><TableHead>Mã</TableHead><TableHead>Hoa hồng</TableHead><TableHead>Giới thiệu</TableHead><TableHead>Số dư</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><div className="font-medium">{a.userName}</div><div className="text-xs text-muted-foreground">{a.userEmail}</div></TableCell>
                  <TableCell className="font-mono text-sm">{a.code}</TableCell>
                  <TableCell>{a.commissionRate}%</TableCell>
                  <TableCell>{formatNumber(a.referredCount)}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatPrice(a.balance)}</TableCell>
                  <TableCell><Badge className={cn("border-0", AFFILIATE_STATUS_COLORS[a.status])}>{AFFILIATE_STATUS_LABELS[a.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === "PENDING" && (<>
                        <Button size="sm" disabled={busy === a.id} onClick={() => updateStatus(a.id, "APPROVED")} className="h-8 gap-1 bg-green-600 hover:bg-green-700"><Check className="h-3.5 w-3.5" /> Duyệt</Button>
                        <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => updateStatus(a.id, "REJECTED")} className="h-8 gap-1"><X className="h-3.5 w-3.5" /> Từ chối</Button>
                      </>)}
                      {a.status === "APPROVED" && (
                        <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => updateStatus(a.id, "SUSPENDED")} className="h-8 gap-1 text-destructive"><Ban className="h-3.5 w-3.5" /> Khóa</Button>
                      )}
                      {a.status === "SUSPENDED" && (
                        <Button size="sm" disabled={busy === a.id} onClick={() => updateStatus(a.id, "APPROVED")} className="h-8 gap-1"><Check className="h-3.5 w-3.5" /> Mở lại</Button>
                      )}
                      <Button asChild size="sm" variant="ghost" className="h-8 gap-1"><Link href={`/admin/tiep-thi/${a.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function PayoutsTab() {
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback((st: string) => {
    setLoading(true);
    fetch(`/api/admin/payouts?status=${st}`)
      .then((r) => r.json())
      .then((d) => { setItems(d?.payouts ?? []); setCounts(d?.statusCounts ?? {}); })
      .catch((e) => { console.error("Failed to load payouts", e); toast.error("Không thể tải thanh toán."); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(status); }, [status, load, setLoading, setItems, setCounts]);

  const process = async (id: string, newStatus: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { toast.success("Đã cập nhật"); load(status); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Lỗi"); } finally { setBusy(""); }
  };

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const filters = [{ key: "ALL", label: "Tất cả", count: total }, ...["PENDING", "PAID", "REJECTED"].map((s) => ({ key: s, label: PAYOUT_STATUS_LABELS[s], count: counts[s] ?? 0 }))];

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", status === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70")}>
            {f.label} <span className="ml-1 opacity-70">({formatNumber(f.count)})</span>
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><Banknote className="h-10 w-10" /><p>Không có yêu cầu rút tiền.</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Đối tác</TableHead><TableHead>Số tiền</TableHead><TableHead>Tài khoản nhận</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><div className="font-medium">{p.userName}</div><div className="text-xs text-muted-foreground">{p.affiliateCode}</div></TableCell>
                  <TableCell className="font-semibold text-primary">{formatPrice(p.amount)}</TableCell>
                  <TableCell className="text-sm">{p.bankName}<br /><span className="text-muted-foreground">{p.accountNumber} · {p.accountName}</span></TableCell>
                  <TableCell><Badge className={cn("border-0", PAYOUT_STATUS_COLORS[p.status])}>{PAYOUT_STATUS_LABELS[p.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "PENDING" ? (<>
                        <Button size="sm" disabled={busy === p.id} onClick={() => process(p.id, "PAID")} className="h-8 gap-1 bg-green-600 hover:bg-green-700"><Check className="h-3.5 w-3.5" /> Đã chi</Button>
                        <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => process(p.id, "REJECTED")} className="h-8 gap-1"><X className="h-3.5 w-3.5" /> Từ chối</Button>
                      </>) : <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default function AdminAffiliatePage() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-sans text-2xl font-bold">Tiếp thị liên kết</h1>
      <p className="text-muted-foreground">Quản lý đối tác và yêu cầu rút tiền.</p>
      <Tabs defaultValue="affiliates" className="mt-6">
        <TabsList>
          <TabsTrigger value="affiliates">Đối tác</TabsTrigger>
          <TabsTrigger value="payouts">Yêu cầu rút tiền</TabsTrigger>
        </TabsList>
        <TabsContent value="affiliates"><AffiliatesTab /></TabsContent>
        <TabsContent value="payouts"><PayoutsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
