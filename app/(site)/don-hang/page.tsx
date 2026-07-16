"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Package, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/orders";
import { toast } from "sonner";

export default function OrdersPage() {
  const router = useRouter();
  const { status } = useSession() || {};
  const [orders, setOrders] = useState<Array<{ id: string; orderCode: string; status: string; total: number; itemsCount: number; firstItemImage?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dang-nhap?callbackUrl=/don-hang");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => setOrders(d?.orders ?? []))
        .catch(() => { toast.error("Không thể tải dữ liệu."); })
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-sans text-3xl font-bold">Đơn hàng của tôi</h1>
      <p className="mt-1 text-muted-foreground">Theo dõi và quản lý các đơn hàng của bạn</p>

      {orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl bg-card py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-sans text-xl font-bold">Chưa có đơn hàng</h2>
          <p className="mt-1 text-muted-foreground">Bạn chưa đặt đơn hàng nào.</p>
          <Button asChild className="mt-6"><Link href="/san-pham"><ShoppingBag className="mr-2 h-4 w-4" />Mua sắm ngay</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/don-hang/${o.id}`}
              className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {o.firstItemImage ? <Image src={o.firstItemImage} alt="Đơn hàng" fill className="object-cover" sizes="64px" /> : <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{o.orderCode}</span>
                  <Badge className={ORDER_STATUS_COLORS[o.status] ?? ""}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{o.itemsCount} sản phẩm • {formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <div className="font-sans font-bold text-primary">{formatPrice(o.total)}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
