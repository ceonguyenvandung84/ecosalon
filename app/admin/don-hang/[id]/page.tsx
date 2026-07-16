"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Save, User, Phone, Mail, MapPin, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getStatusTransitions } from "@/lib/orders";
import { toast } from "sonner";
import type { OrderDetailItem } from "@/lib/types";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d?.order) { setOrder(d.order); setStatus(d.order.status); } })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load, setLoading, setOrder, setStatus]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) { toast.success("Đã cập nhật trạng thái"); load(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Cập nhật thất bại"); }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="p-8"><p className="text-muted-foreground">Không tìm thấy đơn hàng.</p><Button asChild variant="outline" className="mt-4"><Link href="/admin/don-hang">Quay lại</Link></Button></div>;

  return (
    <div className="p-6 lg:p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5"><Link href="/admin/don-hang"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Link></Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-bold">Đơn hàng {order.orderCode}</h1>
          <p className="text-muted-foreground">Đặt ngày {formatDate(order.createdAt)}</p>
        </div>
        <Badge className={cn("border-0 text-sm", ORDER_STATUS_COLORS[order.status])}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-semibold">Sản phẩm</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {it.productImage ? <Image src={it.productImage} alt={it.productTitle} fill className="object-cover" unoptimized /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{it.productTitle}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(it.unitPrice)} × {formatNumber(it.quantity)}</div>
                  </div>
                  <div className="font-semibold">{formatPrice(it.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Miễn phí"}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(order.total)}</span></div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-semibold">Thông tin giao hàng</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customerPhone}</div>
              {order.customerEmail ? <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {order.customerEmail}</div> : null}
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {order.shippingAddress}</div>
              {order.note ? <div className="flex items-start gap-2"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {order.note}</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-semibold">Cập nhật trạng thái</h2>
            <div className="mt-4 space-y-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(getStatusTransitions(order.orderType)[order.status] ?? [order.status]).map((s: string) => (<SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s] ?? s}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={() => { if (!confirm("Bạn có chắc muốn cập nhật trạng thái đơn hàng?")) return; save(); }} disabled={saving || status === order.status} className="w-full gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu trạng thái</Button>
              <p className="text-xs text-muted-foreground">Khi chuyển sang trạng thái đã thanh toán, kho hàng sẽ tự động trừ và số lượng đã bán tăng lên.</p>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-semibold">Thanh toán</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Phương thức</span><span className="font-medium">{order.paymentMethod === "VNPAY" ? "VNPay" : order.paymentMethod === "MOMO" ? "MoMo" : "Chuyển khoản QR"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Đã thanh toán</span><span className="font-medium">{order.paidAt ? formatDate(order.paidAt) : "Chưa"}</span></div>
              {order.user?.email ? <div className="flex justify-between"><span className="text-muted-foreground">Tài khoản</span><span className="font-medium">{order.user.email}</span></div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
