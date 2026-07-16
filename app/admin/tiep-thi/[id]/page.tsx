"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Save, User, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import {
  AFFILIATE_STATUS_LABELS, AFFILIATE_STATUS_COLORS,
  COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS,
  PAYOUT_STATUS_LABELS, PAYOUT_STATUS_COLORS,
} from "@/lib/affiliate";
import { toast } from "sonner";
import type { AffiliateDetailItem } from "@/lib/types";

export default function AdminAffiliateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [a, setA] = useState<AffiliateDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/affiliates/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.affiliate) { setA(d.affiliate); setRate(String(d.affiliate.commissionRate)); } })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { if (id) load(); }, [id, load, setLoading, setA]);

  const saveRate = async () => {
    setSavingRate(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commissionRate: Number(rate) }) });
      if (res.ok) { toast.success("Đã cập nhật tỷ lệ hoa hồng"); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Thất bại"); }
    } catch { toast.error("Lỗi"); } finally { setSavingRate(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!a) return <div className="p-8"><p className="text-muted-foreground">Không tìm thấy.</p><Button asChild variant="outline" className="mt-4"><Link href="/admin/tiep-thi">Quay lại</Link></Button></div>;

  return (
    <div className="p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5"><Link href="/admin/tiep-thi"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold">{a.user?.fullName}</h1>
          <p className="text-muted-foreground">Mã giới thiệu: <span className="font-mono font-semibold text-foreground">{a.code}</span></p>
        </div>
        <Badge className={cn("border-0 text-sm", AFFILIATE_STATUS_COLORS[a.status])}>{AFFILIATE_STATUS_LABELS[a.status]}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Số dư khả dụng", value: formatPrice(a.balance) },
          { label: "Tổng hoa hồng", value: formatPrice(a.totalEarned) },
          { label: "Đã chi trả", value: formatPrice(a.totalPaid) },
          { label: "Người giới thiệu", value: formatNumber(a.referredUsers?.length ?? 0) },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-sm"><div className="text-sm text-muted-foreground">{s.label}</div><div className="mt-1 text-xl font-bold">{s.value}</div></div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h2 className="font-sans text-lg font-semibold">Thông tin đối tác</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {a.user?.fullName}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {a.user?.email}</div>
            {a.user?.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {a.user.phone}</div> : null}
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h2 className="font-sans text-lg font-semibold">Tỷ lệ hoa hồng</h2>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1 space-y-1.5"><Label>Phần trăm (%)</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
            <Button onClick={saveRate} disabled={savingRate} className="gap-2">{savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu</Button>
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h2 className="font-sans text-lg font-semibold">Tài khoản nhận tiền</h2>
          <div className="mt-4 space-y-1 text-sm">
            <div>{a.payoutBankName || <span className="text-muted-foreground">Chưa cập nhật</span>}</div>
            <div className="text-muted-foreground">{a.payoutAccountNumber} {a.payoutAccountName ? `· ${a.payoutAccountName}` : ""}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        <div className="p-5"><h2 className="font-sans text-lg font-semibold">Người được giới thiệu</h2></div>
        {(!a.referredUsers || a.referredUsers.length === 0) ? <p className="px-5 pb-6 text-sm text-muted-foreground">Chưa có ai.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Họ tên</TableHead><TableHead>Email</TableHead><TableHead>Ngày đăng ký</TableHead></TableRow></TableHeader>
            <TableBody>{a.referredUsers.map((u) => (<TableRow key={u.id}><TableCell>{u.fullName}</TableCell><TableCell className="text-muted-foreground">{u.email}</TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell></TableRow>))}</TableBody>
          </Table>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        <div className="p-5"><h2 className="font-sans text-lg font-semibold">Lịch sử hoa hồng</h2></div>
        {(!a.commissions || a.commissions.length === 0) ? <p className="px-5 pb-6 text-sm text-muted-foreground">Chưa có hoa hồng.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Tỷ lệ</TableHead><TableHead>Hoa hồng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày</TableHead></TableRow></TableHeader>
            <TableBody>{a.commissions.map((c) => (<TableRow key={c.id}><TableCell className="font-mono text-sm">{c.orderCode}</TableCell><TableCell>{c.rate}%</TableCell><TableCell className="font-semibold text-primary">{formatPrice(c.amount)}</TableCell><TableCell><Badge className={cn("border-0", COMMISSION_STATUS_COLORS[c.status])}>{COMMISSION_STATUS_LABELS[c.status]}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell></TableRow>))}</TableBody>
          </Table>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        <div className="p-5"><h2 className="font-sans text-lg font-semibold">Lịch sử rút tiền</h2></div>
        {(!a.payouts || a.payouts.length === 0) ? <p className="px-5 pb-6 text-sm text-muted-foreground">Chưa có yêu cầu.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Số tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày yêu cầu</TableHead><TableHead>Ngày xử lý</TableHead></TableRow></TableHeader>
            <TableBody>{a.payouts.map((p) => (<TableRow key={p.id}><TableCell className="font-semibold">{formatPrice(p.amount)}</TableCell><TableCell><Badge className={cn("border-0", PAYOUT_STATUS_COLORS[p.status])}>{PAYOUT_STATUS_LABELS[p.status]}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell><TableCell className="text-sm text-muted-foreground">{p.processedAt ? formatDate(p.processedAt) : "—"}</TableCell></TableRow>))}</TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
