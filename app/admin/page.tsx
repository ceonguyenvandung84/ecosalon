"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GraduationCap, ShoppingBag, Users, BookOpen, Star, Loader2 } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import type { AdminStats, SignupTrendPoint, CategoryDataPoint, AdminRecentUser } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { CardGridSkeleton, ChartPanelSkeleton } from "@/components/ui/skeletons";

const SignupsChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.SignupsChart), { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> });
const CategoryChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.CategoryChart), { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> });

interface AdminDashboardData {
  stats: AdminStats;
  signupsTrend: SignupTrendPoint[];
  courseByCategory: CategoryDataPoint[];
  recentUsers: AdminRecentUser[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData).catch(() => { toast.error("Không thể tải dữ liệu."); }).finally(() => setLoading(false));
  }, []);

  const s = data?.stats ?? ({} as AdminStats);
  const cards = [
    { label: "Học viên", value: s.users ?? 0, icon: Users, href: "/admin/nguoi-dung" },
    { label: "Khóa học", value: s.courses ?? 0, icon: GraduationCap, href: "/admin/khoa-hoc" },
    { label: "Sản phẩm", value: s.products ?? 0, icon: ShoppingBag, href: "/admin/san-pham" },
    { label: "Ghi danh", value: s.enrollments ?? 0, icon: BookOpen, href: "/admin/khoa-hoc" },
    { label: "Đánh giá", value: s.reviews ?? 0, icon: Star, href: "/admin/don-hang" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-sans text-2xl font-bold">Tổng quan</h1>
      <p className="mt-1 text-muted-foreground">Bảng điều khiển quản trị SALON HAIR SYSTEM.</p>

      {loading ? (
        <div className="mt-6 space-y-6">
          <CardGridSkeleton count={5} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartPanelSkeleton />
            <ChartPanelSkeleton />
          </div>
        </div>
      ) : (
      <>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}>
              <Panel padding="5" className="transition-all hover:shadow-md cursor-pointer">
                <div className="flex items-center justify-between"><c.icon className="h-6 w-6 text-primary" /></div>
                <div className="mt-3 font-sans text-2xl font-bold">{formatNumber(c.value)}</div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
              </Panel>
            </Link>
          ))}
        </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel padding="5">
              <h2 className="mb-4 font-semibold">Đăng ký 7 ngày qua</h2>
              <div className="h-64"><ErrorBoundary><SignupsChart data={(data?.signupsTrend ?? []).map((d) => ({ name: d.date, value: d.count }))} /></ErrorBoundary></div>
            </Panel>
            <Panel padding="5">
              <h2 className="mb-4 font-semibold">Khóa học theo danh mục</h2>
              <div className="h-64"><ErrorBoundary><CategoryChart data={data?.courseByCategory ?? []} /></ErrorBoundary></div>
            </Panel>
          </div>

        <Panel padding="5" className="mt-6">
          <h2 className="mb-4 font-semibold">Người dùng mới</h2>
          <div className="space-y-2">
            {(data?.recentUsers ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2.5">
                <div><div className="font-medium">{u.fullName}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                <div className="flex items-center gap-3"><Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge><span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span></div>
              </div>
            ))}
          </div>
        </Panel>
      </>
      )}
    </div>
  );
}
