"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Package, MapPin, ArrowLeft, QrCode, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/orders";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<{
    id: string; orderCode: string; status: string; createdAt: string;
    customerName: string; customerPhone: string; customerEmail?: string;
    shippingAddress: string; note?: string; subtotal: number; shippingFee: number; total: number;
    items: Array<{ id: string; productImage?: string; productTitle: string; unitPrice: number; quantity: number; lineTotal: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const d = await res.json();
      setOrder(d?.order ?? null);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load, setLoading, setOrder]);

  async function cancelOrder() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đã hủy đơn hàng");
        load();
      } else {
        toast.error(d?.error ?? "Hủy thất bại");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return <div className="py-32 text-center text-muted-foreground">Không tìm thấy đơn hàng.</div>;
  }

  const isPending = order.status === "PENDING_PAYMENT";

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/don-hang" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />Quay lại danh sách
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold">Đơn hàng {order.orderCode}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Đặt ngày {formatDate(order.createdAt)}</p>
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status] ?? ""}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      {isPending ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4">
          <p className="flex-1 text-sm text-amber-800">Đơn hàng đang chờ thanh toán. Vui lòng hoàn tất chuyển khoản.</p>
          <Button asChild size="sm"><Link href={`/thanh-toan/${order.id}`}><QrCode className="mr-2 h-4 w-4" />Xem mã QR thanh toán</Link></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={cancelling}><XCircle className="mr-2 h-4 w-4" />Hủy đơn</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hủy đơn hàng?</AlertDialogTitle>
                <AlertDialogDescription>Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Không</AlertDialogCancel>
                <AlertDialogAction onClick={cancelOrder}>Hủy đơn hàng</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold"><Package className="h-5 w-5 text-primary" />Sản phẩm</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {it.productImage ? <Image src={it.productImage} alt={it.productTitle} fill className="object-cover" sizes="56px" /> : null}
              </div>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-medium">{it.productTitle}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(it.unitPrice)} x {it.quantity}</p>
              </div>
              <span className="font-semibold">{formatPrice(it.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</span></div>
          <div className="flex items-center justify-between border-t border-border pt-2"><span className="font-semibold">Tổng cộng</span><span className="font-sans text-lg font-extrabold text-primary">{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold"><MapPin className="h-5 w-5 text-primary" />Thông tin giao hàng</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-medium">{order.customerName} • {order.customerPhone}</p>
          {order.customerEmail ? <p className="text-muted-foreground">{order.customerEmail}</p> : null}
          <p className="text-muted-foreground">{order.shippingAddress}</p>
          {order.note ? <p className="text-muted-foreground">Ghi chú: {order.note}</p> : null}
        </div>
      </div>
    </div>
  );
}
