"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Copy, Check, Megaphone, Users, Wallet, TrendingUp, Banknote, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import {
  AFFILIATE_STATUS_LABELS, AFFILIATE_STATUS_COLORS,
  COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS,
  PAYOUT_STATUS_LABELS, PAYOUT_STATUS_COLORS, MIN_PAYOUT,
} from "@/lib/affiliate";
import { toast } from "sonner";

export default function AffiliatePage() {
  const [affiliate, setAffiliate] = useState<{
    id: string; status: string; code?: string; balance: number; totalEarned: number;
    totalPaid: number; commissionRate: number;
    payoutBankName?: string; payoutAccountNumber?: string; payoutAccountName?: string;
    _count?: { referredUsers: number };
    commissions?: Array<{ id: string; orderCode: string; rate: number; amount: number; status: string; createdAt: string }>;
    payouts?: Array<{ id: string; amount: number; bankName?: string; accountNumber?: string; status: string; createdAt: string; processedAt?: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const [bank, setBank] = useState({ payoutBankName: "", payoutAccountNumber: "", payoutAccountName: "" });
  const [savingBank, setSavingBank] = useState(false);
  const [amount, setAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/affiliate")
      .then((r) => r.json())
      .then((d) => {
        setAffiliate(d?.affiliate ?? null);
        if (d?.affiliate) {
          setBank({
            payoutBankName: d.affiliate.payoutBankName ?? "",
            payoutAccountNumber: d.affiliate.payoutAccountNumber ?? "",
            payoutAccountName: d.affiliate.payoutAccountName ?? "",
          });
        }
      })
      .catch((e) => console.error("Failed to load affiliate data", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); if (typeof window !== "undefined") setOrigin(window.location.origin); }, [load, setOrigin]);

  const register = async () => {
    setRegistering(true);
    try {
      const res = await fetch("/api/affiliate", { method: "POST" });
      if (res.ok) { toast.success("Đã đăng ký! Vui lòng chờ quản trị viên duyệt."); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Đăng ký thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setRegistering(false); }
  };

  const referralLink = affiliate?.code ? `${origin}/?ref=${affiliate.code}` : "";
  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); toast.success("Đã sao chép liên kết"); setTimeout(() => setCopied(false), 1800); });
  };

  const saveBank = async () => {
    setSavingBank(true);
    try {
      const res = await fetch("/api/affiliate", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bank) });
      if (res.ok) { toast.success("Đã lưu thông tin ngân hàng"); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Lưu thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSavingBank(false); }
  };

  const requestPayout = async () => {
    const amt = Math.round(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
    setRequesting(true);
    try {
      const res = await fetch("/api/affiliate/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amt }) });
      if (res.ok) { toast.success("Đã gửi yêu cầu rút tiền"); setAmount(""); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Yêu cầu thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setRequesting(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!affiliate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Megaphone className="h-8 w-8 text-primary" /></div>
        <h1 className="mt-6 font-sans text-3xl font-bold">Trở thành Đối tác Tiếp thị liên kết</h1>
        <p className="mt-3 text-muted-foreground">Giới thiệu khách hàng mua sản phẩm qua liên kết riêng của bạn và nhận hoa hồng trên mỗi đơn hàng thành công.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[{ i: Users, t: "Chia sẻ liên kết", d: "Nhận link giới thiệu riêng" }, { i: TrendingUp, t: "Khách đặt hàng", d: "Hệ thống tự động ghi nhận" }, { i: Wallet, t: "Nhận hoa hồng", d: "Rút về tài khoản ngân hàng" }].map((s, idx) => (
            <div key={idx} className="rounded-xl bg-card p-5 text-center shadow-sm">
              <s.i className="mx-auto h-7 w-7 text-primary" />
              <div className="mt-3 font-semibold">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
        <Button onClick={register} disabled={registering} size="lg" className="mt-8 gap-2">
          {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Đăng ký ngay
        </Button>
      </div>
    );
  }

  const isApproved = affiliate.status === "APPROVED";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold">Tiếp thị liên kết</h1>
          <p className="text-muted-foreground">Quản lý liên kết giới thiệu và hoa hồng của bạn.</p>
        </div>
        <Badge className={cn("border-0 text-sm", AFFILIATE_STATUS_COLORS[affiliate.status])}>{AFFILIATE_STATUS_LABELS[affiliate.status]}</Badge>
      </div>

      {affiliate.status === "PENDING" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          Tài khoản tiếp thị của bạn đang chờ quản trị viên duyệt. Bạn sẽ nhận được liên kết giới thiệu sau khi được duyệt.
        </div>
      )}
      {affiliate.status === "REJECTED" && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">Rất tiếc, đăng ký tiếp thị của bạn chưa được duyệt.</div>
      )}
      {affiliate.status === "SUSPENDED" && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-700">Tài khoản tiếp thị của bạn đang tạm khóa. Vui lòng liên hệ quản trị viên.</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Wallet, label: "Số dư khả dụng", value: formatPrice(affiliate.balance), accent: true },
          { i: TrendingUp, label: "Tổng hoa hồng", value: formatPrice(affiliate.totalEarned) },
          { i: Banknote, label: "Đã chi trả", value: formatPrice(affiliate.totalPaid) },
          { i: Users, label: "Người giới thiệu", value: formatNumber(affiliate._count?.referredUsers ?? 0) },
        ].map((s, idx) => (
          <div key={idx} className={cn("rounded-xl bg-card p-5 shadow-sm", s.accent && "ring-1 ring-primary/20")}>
            <s.i className={cn("h-6 w-6", s.accent ? "text-primary" : "text-muted-foreground")} />
            <div className="mt-3 text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {isApproved && (
        <>
          <div className="mt-6 rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-semibold">Liên kết giới thiệu của bạn</h2>
            <p className="text-sm text-muted-foreground">Chia sẻ liên kết này. Khách đăng ký qua liên kết và mua hàng sẽ giúp bạn nhận hoa hồng {affiliate.commissionRate}%.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={referralLink} className="font-mono text-sm" />
              <Button onClick={copyLink} className="gap-2 shrink-0">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Đã chép" : "Sao chép"}</Button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Mã giới thiệu: <span className="font-mono font-semibold text-foreground">{affiliate.code}</span></div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h2 className="font-sans text-lg font-semibold">Tài khoản nhận tiền</h2>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label>Tên ngân hàng</Label><Input value={bank.payoutBankName} onChange={(e) => setBank((p) => ({ ...p, payoutBankName: e.target.value }))} placeholder="VD: Vietcombank" /></div>
                <div className="space-y-1.5"><Label>Số tài khoản</Label><Input value={bank.payoutAccountNumber} onChange={(e) => setBank((p) => ({ ...p, payoutAccountNumber: e.target.value }))} placeholder="VD: 1027391102" /></div>
                <div className="space-y-1.5"><Label>Chủ tài khoản</Label><Input value={bank.payoutAccountName} onChange={(e) => setBank((p) => ({ ...p, payoutAccountName: e.target.value }))} placeholder="VD: NGUYEN VAN A" /></div>
                <Button onClick={saveBank} disabled={savingBank} variant="outline" className="gap-2">{savingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Lưu thông tin</Button>
              </div>
            </div>

            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h2 className="font-sans text-lg font-semibold">Yêu cầu rút tiền</h2>
              <p className="text-sm text-muted-foreground">Số dư khả dụng: <span className="font-semibold text-foreground">{formatPrice(affiliate.balance)}</span>. Rút tối thiểu {formatPrice(MIN_PAYOUT)}.</p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label>Số tiền muốn rút (đ)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="VD: 500000" /></div>
                <Button onClick={requestPayout} disabled={requesting || affiliate.balance < MIN_PAYOUT} className="w-full gap-2">{requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi yêu cầu</Button>
                {affiliate.balance < MIN_PAYOUT && <p className="text-xs text-muted-foreground">Số dư chưa đủ mức rút tối thiểu.</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
            <div className="flex items-center justify-between p-5"><h2 className="font-sans text-lg font-semibold">Lịch sử hoa hồng</h2></div>
            {(!affiliate.commissions || affiliate.commissions.length === 0) ? (
              <p className="px-5 pb-6 text-sm text-muted-foreground">Chưa có hoa hồng nào.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Tỷ lệ</TableHead><TableHead>Hoa hồng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày</TableHead></TableRow></TableHeader>
                <TableBody>
                  {affiliate.commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.orderCode}</TableCell>
                      <TableCell>{c.rate}%</TableCell>
                      <TableCell className="font-semibold text-primary">{formatPrice(c.amount)}</TableCell>
                      <TableCell><Badge className={cn("border-0", COMMISSION_STATUS_COLORS[c.status])}>{COMMISSION_STATUS_LABELS[c.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
            <div className="flex items-center justify-between p-5"><h2 className="font-sans text-lg font-semibold">Lịch sử rút tiền</h2></div>
            {(!affiliate.payouts || affiliate.payouts.length === 0) ? (
              <p className="px-5 pb-6 text-sm text-muted-foreground">Chưa có yêu cầu rút tiền nào.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Số tiền</TableHead><TableHead>Ngân hàng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày yêu cầu</TableHead><TableHead>Ngày xử lý</TableHead></TableRow></TableHeader>
                <TableBody>
                  {affiliate.payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{formatPrice(p.amount)}</TableCell>
                      <TableCell className="text-sm">{p.bankName} · {p.accountNumber}</TableCell>
                      <TableCell><Badge className={cn("border-0", PAYOUT_STATUS_COLORS[p.status])}>{PAYOUT_STATUS_LABELS[p.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.processedAt ? formatDate(p.processedAt) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
