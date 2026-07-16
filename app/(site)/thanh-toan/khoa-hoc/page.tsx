"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function CourseCheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const courseIds = (params.get("courses") ?? "").split(",").filter(Boolean);

  const [courses, setCourses] = useState<Array<{
    id: string; title: string; price: number; discountPrice?: number;
    thumbnailPath?: string; instructorName?: string; isPublished?: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount: number; message: string; newTotal: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_QR");

  useEffect(() => {
    if (courseIds.length === 0) { setLoading(false); return; }
    Promise.all(courseIds.map((id) => fetch(`/api/courses/${id}`).then((r) => r.json())))
      .then((results) => {
        const valid = results
          .map((r) => r?.course)
          .filter(Boolean)
          .filter((c) => c.isPublished);
        setCourses(valid);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [courseIds, setLoading, setCourses]);

  const subtotal = courses.reduce((s, c) => {
    const price = c.discountPrice ?? c.price;
    return s + price;
  }, 0);
  const discount = couponResult?.valid ? couponResult.discount : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const firstCourseId = courseIds[0];
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, courseId: firstCourseId, subtotal }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Mã không hợp lệ"); setCouponResult(null); return; }
      setCouponResult(d);
      toast.success(d.message);
    } catch { toast.error("Lỗi kiểm tra coupon"); setCouponResult(null); }
    finally { setCouponLoading(false); }
  };

  const submit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại.");
      return;
    }

    setSubmitting(true);
    try {
      const items = courses.map((c) => ({
        courseId: c.id,
        price: c.discountPrice ?? c.price,
      }));

      const res = await fetch("/api/courses/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          couponCode: couponResult?.valid ? couponCode : undefined,
          customerName,
          customerPhone,
          customerEmail,
          paymentMethod,
        }),
      });
      const d = await res.json();

      if (!res.ok) {
        toast.error(d.error || "Tạo đơn hàng thất bại");
        return;
      }

      if (paymentMethod === "BANK_QR") {
        router.push(`/thanh-toan/${d.orderId}`);
      } else if (paymentMethod === "VNPAY") {
        const createRes = await fetch("/api/payment/vnpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: d.orderId,
            orderCode: d.orderCode,
            amount: d.total,
          }),
        });
        const createData = await createRes.json();
        if (createData.paymentUrl) window.location.href = createData.paymentUrl;
        else toast.error("Tạo link thanh toán thất bại");
      } else if (paymentMethod === "MOMO") {
        const createRes = await fetch("/api/payment/momo/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: d.orderId,
            orderCode: d.orderCode,
            amount: d.total,
          }),
        });
        const createData = await createRes.json();
        if (createData.payUrl) window.location.href = createData.payUrl;
        else if (createData.deeplink) window.location.href = createData.deeplink;
        else toast.error("Tạo link thanh toán thất bại");
      }
    } catch { toast.error("Đã có lỗi xảy ra"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (courseIds.length === 0 || courses.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Không có khóa học nào</h1>
        <p className="mt-2 text-muted-foreground">Vui lòng chọn khóa học để thanh toán.</p>
        <Button asChild className="mt-6"><Link href="/khoa-hoc">Xem khóa học</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/khoa-hoc" className="text-sm text-muted-foreground hover:text-foreground">Khóa học</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Thanh toán</span>
      </div>

      <h1 className="font-sans text-2xl font-bold">Thanh toán khóa học</h1>

      {/* Course Items */}
      <div className="mt-6 space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {c.thumbnailPath ? (
                <Image src={c.thumbnailPath} alt={c.title} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2">{c.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.instructorName}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-bold text-primary">{formatPrice(c.discountPrice ?? c.price)}</span>
                {c.discountPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(c.price)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Tag className="h-4 w-4" /> Mã giảm giá</h3>
        <div className="mt-3 flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value); setCouponResult(null); }}
            placeholder="Nhập mã (VD: SUMMER2025)"
            className="font-mono"
          />
          <Button variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
          </Button>
        </div>
        {couponResult?.valid && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {couponResult.message} — Còn {formatPrice(couponResult.newTotal)}đ
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatPrice(discount)}</span></div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-lg">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-6 space-y-4">
        <h3 className="font-semibold">Thông tin học viên</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Họ tên *</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="space-y-2">
            <Label>Điện thoại *</Label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0912 345 678" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="nguyenvana@email.com" />
        </div>
      </div>

      {/* Payment Method */}
      <div className="mt-6 space-y-3">
        <h3 className="font-semibold">Phương thức thanh toán</h3>
        <div className="space-y-2">
          {[
            { value: "BANK_QR", label: "Chuyển khoản QR", desc: "Miễn phí thanh toán, xác nhận trong 24h" },
            { value: "VNPAY", label: "VNPay", desc: "Thanh toán qua cổng VNPay" },
            { value: "MOMO", label: "MoMo", desc: "Thanh toán qua ví MoMo" },
          ].map((pm) => (
            <label
              key={pm.value}
              className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                paymentMethod === pm.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={pm.value}
                checked={paymentMethod === pm.value}
                onChange={() => setPaymentMethod(pm.value)}
                className="accent-primary"
              />
              <div>
                <span className="font-medium">{pm.label}</span>
                <p className="text-xs text-muted-foreground">{pm.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button
        className="mt-6 w-full"
        size="lg"
        onClick={submit}
        disabled={submitting || courses.length === 0}
      >
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Xác nhận thanh toán — {formatPrice(total)}
      </Button>
    </div>
  );
}