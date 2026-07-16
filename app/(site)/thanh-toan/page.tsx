"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ShoppingCart, MapPin, QrCode, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/components/site/cart-provider";
import { formatPrice } from "@/lib/utils";
import { computeShippingFee } from "@/lib/orders";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
  title: string;
  image: string;
  unitPrice: number;
  lineTotal: number;
}

const PAYMENT_METHODS = [
  { value: "BANK_QR", label: "Chuyển khoản ngân hàng (VietQR)", icon: QrCode, desc: "Quét mã QR để thanh toán qua app ngân hàng" },
  { value: "VNPAY", label: "VNPay", icon: Banknote, desc: "Thanh toán qua cổng VNPay (thẻ ATM, Visa, Mastercard)" },
  { value: "MOMO", label: "MoMo", icon: Smartphone, desc: "Thanh toán qua ví MoMo" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { refresh } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK_QR");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    note: "",
  });
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dang-nhap?callbackUrl=/thanh-toan");
      return;
    }
    if (status === "authenticated") {
      const u = session?.user;
      setForm((f) => ({
        ...f,
        customerName: u?.name ?? "",
        customerEmail: u?.email ?? "",
      }));
      fetch("/api/cart")
        .then((r) => r.json())
        .then((d) => setItems(d?.items ?? []))
        .catch(() => { toast.error("Không thể tải dữ liệu."); })
        .finally(() => setLoading(false));
    }
  }, [status, session, router, setLoading, setItems, setForm]);

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shippingFee = computeShippingFee(subtotal);
  const total = subtotal + shippingFee;

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.shippingAddress.trim()) {
      toast.error("Vui lòng điền họ tên, số điện thoại và địa chỉ.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paymentMethod }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.orderId) {
        refresh();
        toast.success("Đặt hàng thành công!");
        if (paymentMethod === "VNPAY") {
          const payRes = await fetch("/api/payment/vnpay/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: d.orderId, orderCode: d.orderCode, amount: total }),
          });
          const payData = await payRes.json();
          if (payData?.paymentUrl) {
            window.location.href = payData.paymentUrl;
            return;
          }
        } else if (paymentMethod === "MOMO") {
          const payRes = await fetch("/api/payment/momo/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: d.orderId, orderCode: d.orderCode, amount: total }),
          });
          const payData = await payRes.json();
          if (payData?.payUrl) {
            window.location.href = payData.payUrl;
            return;
          }
        }
        router.push(`/thanh-toan/${d.orderId}`);
      } else {
        toast.error(d?.error ?? "Đặt hàng thất bại.");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-sans text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mt-2 text-muted-foreground">Không có sản phẩm nào để thanh toán.</p>
        <Button asChild className="mt-6">
          <Link href="/san-pham">Mua sắm ngay</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-sans text-3xl font-bold">Thanh toán</h1>
      <p className="mt-1 text-muted-foreground">Điền thông tin giao hàng để hoàn tất đơn hàng</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" />Thông tin giao hàng
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Họ và tên <span className="text-destructive">*</span></Label>
                <Input id="customerName" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} className="mt-1.5" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <Label htmlFor="customerPhone">Số điện thoại <span className="text-destructive">*</span></Label>
                <Input id="customerPhone" value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} className="mt-1.5" placeholder="09xx xxx xxx" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input id="customerEmail" type="email" value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} className="mt-1.5" placeholder="email@example.com" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="shippingAddress">Địa chỉ nhận hàng <span className="text-destructive">*</span></Label>
                <Textarea id="shippingAddress" value={form.shippingAddress} onChange={(e) => update("shippingAddress", e.target.value)} className="mt-1.5" rows={2} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                <Textarea id="note" value={form.note} onChange={(e) => update("note", e.target.value)} className="mt-1.5" rows={2} placeholder="Ghi chú cho đơn hàng..." />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-bold">Phương thức thanh toán</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-4 space-y-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <label key={pm.value} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${paymentMethod === pm.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                    <RadioGroupItem value={pm.value} id={pm.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-5 w-5 text-primary" />{pm.label}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl bg-card p-6 shadow-sm">
            <h2 className="font-sans text-lg font-bold">Đơn hàng của bạn</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" /> : null}
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{item.quantity}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                    <p className="text-xs text-primary">{formatPrice(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span></div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-sans text-xl font-extrabold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <Button type="submit" className="mt-6 w-full" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Đặt hàng
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
