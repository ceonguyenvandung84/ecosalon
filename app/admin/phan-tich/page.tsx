"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, TrendingUp, ShoppingCart, Users, Wallet, BarChart3, GraduationCap, ShoppingBag, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, formatNumber, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/orders";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { StatCardSkeleton, ChartPanelSkeleton } from "@/components/ui/skeletons";

const chartLoading = () => <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
const RevenueAreaChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.RevenueAreaChart), { ssr: false, loading: chartLoading });
const OrdersLineChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.OrdersLineChart), { ssr: false, loading: chartLoading });
const HBarChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.HBarChart), { ssr: false, loading: chartLoading });
const SignupsChart = dynamic(() => import("@/components/admin/admin-charts").then((m) => m.SignupsChart), { ssr: false, loading: chartLoading });

const RANGES = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

interface AnalyticsData {
  summary: { totalRevenue: number; paidCount: number; totalOrders: number; aov: number; newCustomers: number };
  revenueTrend: { name: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  newCustomersTrend: { name: string; value: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCourses: { name: string; value: number }[];
  topAffiliates: { name: string; totalEarned: number; clicks: number }[];
  topPosts: { name: string; value: number; slug: string }[];
  topThreads: { name: string; views: number; replies: number; slug: string }[];
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>{children}</div>;
}

const TABS = [
  { value: "edutech", label: "EduTech", icon: GraduationCap },
  { value: "ecommerce", label: "E-Commerce", icon: ShoppingBag },
  { value: "affiliate", label: "Affiliate", icon: Megaphone },
];

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "edutech";

  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, setLoading, setData]);

  const stats = [
    { label: "Doanh thu", value: data ? formatPrice(data.summary.totalRevenue) : "—", icon: TrendingUp, color: "bg-emerald-100 text-emerald-700" },
    { label: "Đơn đã thanh toán", value: data ? formatNumber(data.summary.paidCount) : "—", icon: ShoppingCart, color: "bg-sky-100 text-sky-700" },
    { label: "Giá trị đơn TB", value: data ? formatPrice(data.summary.aov) : "—", icon: Wallet, color: "bg-violet-100 text-violet-700" },
    { label: "Khách hàng mới", value: data ? formatNumber(data.summary.newCustomers) : "—", icon: Users, color: "bg-amber-100 text-amber-700" },
  ];

  const setTab = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "edutech") params.delete("tab");
    else params.set("tab", v);
    router.replace(`/admin/phan-tich${params.toString() ? "?" + params.toString() : ""}`);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-sans text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" /> Báo cáo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Phân tích hiệu suất đào tạo, bán hàng và tiếp thị liên kết.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                days === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && !data ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartPanelSkeleton />
            <ChartPanelSkeleton />
            <ChartPanelSkeleton />
          </div>
        </div>
      ) : !data ? (
        <p className="py-32 text-center text-muted-foreground">Không tải được dữ liệu.</p>
      ) : (
        <div className={cn("mt-6 space-y-6", loading && "opacity-60 transition-opacity")}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="flex items-center gap-4">
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.color)}>
                  <s.icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </Card>
            ))}
          </div>

          {(tab === "edutech" || tab === "ecommerce") && (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <h2 className="font-sans text-base font-bold">Doanh thu theo ngày</h2>
                <div className="mt-4 h-72">
                  <ErrorBoundary><RevenueAreaChart data={data.revenueTrend} /></ErrorBoundary>
                </div>
              </Card>
              <Card>
                <h2 className="font-sans text-base font-bold">Số đơn theo ngày</h2>
                <div className="mt-4 h-72">
                  <ErrorBoundary><OrdersLineChart data={data.revenueTrend} /></ErrorBoundary>
                </div>
              </Card>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="font-sans text-base font-bold">Khách hàng mới theo ngày</h2>
              <div className="mt-4 h-64">
                <ErrorBoundary><SignupsChart data={data.newCustomersTrend} /></ErrorBoundary>
              </div>
            </Card>
            <Card>
              <h2 className="font-sans text-base font-bold">Đơn theo trạng thái</h2>
              <div className="mt-4 space-y-2">
                {data.ordersByStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có đơn hàng.</p>
                ) : (
                  data.ordersByStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <Badge variant="secondary" className={cn("font-medium", ORDER_STATUS_COLORS[s.status])}>
                        {ORDER_STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                      <span className="text-sm font-bold">{formatNumber(s.count)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {tab === "edutech" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="font-sans text-base font-bold">Khóa học ghi danh nhiều</h2>
                {data.topCourses.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                ) : (
                  <div className="mt-4 h-72">
                    <ErrorBoundary><HBarChart data={data.topCourses} dataKey="value" name="Ghi danh" color="#8b5cf6" /></ErrorBoundary>
                  </div>
                )}
              </Card>
              <Card>
                <h2 className="font-sans text-base font-bold">Bài viết xem nhiều</h2>
                <div className="mt-4 space-y-3">
                  {data.topPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                  ) : (
                    data.topPosts.map((p, i) => (
                      <Link key={p.slug ?? `post-${i}`} href={`/bai-viet/${p.slug}`} className="flex items-center justify-between gap-2 hover:text-primary">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <span className="shrink-0 text-sm font-bold">{formatNumber(p.value)}</span>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {tab === "ecommerce" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="font-sans text-base font-bold">Sản phẩm bán chạy</h2>
                {data.topProducts.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                ) : (
                  <div className="mt-4 h-72">
                    <ErrorBoundary><HBarChart data={data.topProducts} dataKey="quantity" name="Số lượng" color="#4CAF50" /></ErrorBoundary>
                  </div>
                )}
              </Card>
              <Card>
                <h2 className="font-sans text-base font-bold">Đơn theo trạng thái</h2>
                <div className="mt-4 space-y-2">
                  {data.ordersByStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <Badge variant="secondary" className={cn("font-medium", ORDER_STATUS_COLORS[s.status])}>
                        {ORDER_STATUS_LABELS[s.status] ?? s.status}
                      </Badge>
                      <span className="text-sm font-bold">{formatNumber(s.count)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === "affiliate" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h2 className="font-sans text-base font-bold">Đối tác tiếp thị hàng đầu</h2>
                <div className="mt-4 space-y-3">
                  {data.topAffiliates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                  ) : (
                    data.topAffiliates.map((a, i) => (
                      <div key={a.name ?? `aff-${i}`} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                          <span className="truncate text-sm font-medium">{a.name}</span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-emerald-600">{formatPrice(a.totalEarned)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card>
                <h2 className="font-sans text-base font-bold">Chủ đề diễn đàn nổi bật</h2>
                <div className="mt-4 space-y-3">
                  {data.topThreads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                  ) : (
                    data.topThreads.map((t, i) => (
                      <Link key={t.slug ?? `thread-${i}`} href={`/dien-dan/${t.slug}`} className="flex items-center justify-between gap-2 hover:text-primary">
                        <span className="truncate text-sm font-medium">{t.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatNumber(t.views)} xem · {formatNumber(t.replies)} trả lời</span>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AnalyticsInner />
    </Suspense>
  );
}
