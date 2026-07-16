"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, Copy, Building2, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/orders";
import { toast } from "sonner";

export default function PaymentPage() {
  const { orderId } = useParams() as { orderId: string };
  const [data, setData] = useState<{
    order: {
      id: string; orderCode: string; status: string; createdAt: string; total: number;
      subtotal: number; shippingFee: number; paymentMethod?: string;
      customerName: string; customerPhone: string; customerEmail?: string;
      shippingAddress: string; note?: string;
      items: Array<{ id: string; productImage?: string; productTitle: string; unitPrice: number; quantity: number; lineTotal: number }>;
    };
    bank?: { accountNumber?: string; bankCode?: string; bankName?: string; accountName?: string };
    qrUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  function copy(text: string | undefined | null, label: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.order) {
    return <div className="py-32 text-center text-muted-foreground">Không tìm thấy đơn hàng.</div>;
  }

  const order = data.order;
  const bank = data.bank ?? {};
  const qrUrl = data.qrUrl;
  const isPending = order.status === "PENDING_PAYMENT";
  const isPaid = order.status === "PAID";
  const bankConfigured = bank.accountNumber && bank.bankCode;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mt-4 font-sans text-3xl font-bold">Đặt hàng thành công!</h1>
        <p className="mt-1 text-muted-foreground">
          Mã đơn hàng: <span className="font-semibold text-foreground">{order.orderCode}</span>
        </p>
        <Badge className={`mt-3 ${ORDER_STATUS_COLORS[order.status] ?? ""}`}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      {isPending ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {order.paymentMethod === "BANK_QR" ? (
            <>
              <div className="rounded-2xl bg-card p-6 text-center shadow-md">
                <h2 className="font-sans text-lg font-bold">Quét mã QR để thanh toán</h2>
                {bankConfigured && qrUrl ? (
                  <div className="mx-auto mt-4 w-full max-w-[280px]">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white">
                      <Image src={qrUrl} alt="Mã QR thanh toán" fill className="object-contain p-2" unoptimized />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                    Thông tin ngân hàng chưa được cấu hình. Vui lòng liên hệ để được hướng dẫn thanh toán.
                  </div>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  Sử dụng ứng dụng ngân hàng / Mobile Banking quét mã QR để chuyển khoản nhanh chóng.
                </p>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-md">
                <h2 className="flex items-center gap-2 font-sans text-lg font-bold"><Building2 className="h-5 w-5 text-primary" />Thông tin chuyển khoản</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {bank.bankName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Ngân hàng</span>
                      <span className="font-semibold">{bank.bankName}</span>
                    </div>
                  ) : null}
                  {bank.accountName ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Chủ tài khoản</span>
                      <span className="font-semibold">{bank.accountName}</span>
                    </div>
                  ) : null}
                  {bank.accountNumber ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Số tài khoản</span>
                      <button onClick={() => copy(bank.accountNumber, "số tài khoản")} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                        {bank.accountNumber}<Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Số tiền</span>
                    <button onClick={() => copy(String(order.total), "số tiền")} className="flex items-center gap-1.5 font-bold text-primary hover:underline">
                      {formatPrice(order.total)}<Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Nội dung CK</span>
                    <button onClick={() => copy(order.orderCode, "nội dung chuyển khoản")} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                      {order.orderCode}<Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  Vui lòng ghi đúng nội dung chuyển khoản <strong>{order.orderCode}</strong> để chúng tôi xác nhận đơn hàng nhanh nhất.
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-card p-6 text-center shadow-md md:col-span-2">
              <h2 className="font-sans text-lg font-bold">{order.paymentMethod === "VNPAY" ? "Thanh toán VNPay" : "Thanh toán MoMo"}</h2>
              <p className="mt-2 text-muted-foreground">
                {order.paymentMethod === "VNPAY"
                  ? "Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay. Vui lòng không đóng trang này."
                  : "Bạn sẽ được chuyển hướng đến ứng dụng MoMo để hoàn tất thanh toán."}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {isPaid ? (
        <div className="mt-6 rounded-xl bg-green-50 p-4 text-center text-sm text-green-700">
          Đơn hàng đã được thanh toán thành công qua {order.paymentMethod === "VNPAY" ? "VNPay" : order.paymentMethod === "MOMO" ? "MoMo" : "chuyển khoản"}.
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold"><Package className="h-5 w-5 text-primary" />Chi tiết đơn hàng</h2>
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
        <div className="mt-4 rounded-lg bg-secondary/40 p-4 text-sm">
          <p className="font-medium">Giao đến: {order.customerName} • {order.customerPhone}</p>
          <p className="mt-1 text-muted-foreground">{order.shippingAddress}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline"><Link href="/don-hang">Xem đơn hàng của tôi</Link></Button>
        <Button asChild><Link href="/san-pham">Tiếp tục mua sắm</Link></Button>
      </div>
    </div>
  );
}
