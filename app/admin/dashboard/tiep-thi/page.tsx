"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, DollarSign, Banknote, Megaphone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DashboardShell } from "@/components/admin/dashboard-shell";
import { toast } from "sonner";

export default function TiepThiDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ affiliates: 0, commissions: 0, pendingPayouts: 0, totalPaid: 0 });
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/affiliates").then((r) => r.json()).then((d) => {
        const list = d?.affiliates ?? [];
        const approved = list.filter((a: any) => a.status === "APPROVED").length;
        setStats((prev) => ({ ...prev, affiliates: approved }));
      }).catch((e) => { console.error("Failed to load affiliates", e); toast.error("Không thể tải đối tác."); }),
      fetch("/api/admin/payouts").then((r) => r.json()).then((d) => {
        const payouts = d?.payouts ?? [];
        const pending = payouts.filter((p: any) => p.status === "PENDING").length;
        const totalPaid = payouts.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
        setStats((prev) => ({ ...prev, pendingPayouts: pending, totalPaid }));
      }).catch((e) => { console.error("Failed to load payouts", e); toast.error("Không thể tải thanh toán."); }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardShell title="Tiếp thị Liên kết" description="Đối tác affiliate, hoa hồng & thanh toán" loading={true} cards={[]} recent={[]} />;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Tiếp thị Liên kết</h1><p className="text-muted-foreground">Đối tác affiliate, hoa hồng & thanh toán</p></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/tiep-thi" className="rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between"><Users className="h-6 w-6 text-blue-600" /></div>
          <div className="mt-3 font-sans text-2xl font-bold">{stats.affiliates}</div>
          <div className="text-sm text-muted-foreground">Đối tác (đã duyệt)</div>
        </Link>
        <Link href="/admin/tiep-thi" className="rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between"><DollarSign className="h-6 w-6 text-amber-600" /></div>
          <div className="mt-3 font-sans text-2xl font-bold">{stats.commissions}</div>
          <div className="text-sm text-muted-foreground">Hoa hồng HOLD</div>
        </Link>
        <Link href="/admin/tiep-thi?tab=payouts" className="rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between"><Banknote className="h-6 w-6 text-purple-600" /></div>
          <div className="mt-3 font-sans text-2xl font-bold">{stats.pendingPayouts}</div>
          <div className="text-sm text-muted-foreground">Yêu cầu thanh toán</div>
        </Link>
        <Link href="/admin/tiep-thi?tab=payouts" className="rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between"><Megaphone className="h-6 w-6 text-green-600" /></div>
          <div className="mt-3 font-sans text-2xl font-bold">{formatPrice(stats.totalPaid)}</div>
          <div className="text-sm text-muted-foreground">Đã chi trả</div>
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Quick Links</h2></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/admin/tiep-thi" className="rounded-lg bg-secondary/40 px-4 py-3 text-sm font-medium hover:bg-secondary/60 transition-colors flex items-center gap-2"><Megaphone className="h-4 w-4" /> Đối tác</Link>
          <Link href="/admin/cai-dat?tab=commission" className="rounded-lg bg-secondary/40 px-4 py-3 text-sm font-medium hover:bg-secondary/60 transition-colors flex items-center gap-2"><DollarSign className="h-4 w-4" /> Cấu hình hoa hồng</Link>
          <Link href="/admin/tiep-thi?tab=payouts" className="rounded-lg bg-secondary/40 px-4 py-3 text-sm font-medium hover:bg-secondary/60 transition-colors flex items-center gap-2"><Banknote className="h-4 w-4" /> Thanh toán</Link>
        </div>
      </div>
    </div>
  );
}
