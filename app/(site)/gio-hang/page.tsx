"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Minus, Plus, Trash2, ShoppingCart, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/cart-provider";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, computeShippingFee } from "@/lib/orders";
import { toast } from "sonner";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  title: string;
  slug: string;
  image: string;
  brand: string;
  price: number;
  discountPercent: number;
  unitPrice: number;
  lineTotal: number;
  stock: number;
}

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession() || {};
  const { refresh } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const d = await res.json();
        setItems(d?.items ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dang-nhap?callbackUrl=/gio-hang");
      return;
    }
    if (status === "authenticated") load();
  }, [status, router, setLoading]);

  async function updateQty(item: CartItem, newQty: number) {
    if (newQty < 1 || newQty > item.stock) return;
    setBusyId(item.id);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty, lineTotal: it.unitPrice * newQty } : it))
    );
    try {
      const res = await fetch(`/api/cart/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) {
        toast.error("Cập nhật thất bại");
        await load();
      } else {
        refresh();
      }
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: CartItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/cart/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        toast.success("Đã xóa khỏi giỏ hàng");
        refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? "Xóa thất bại");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra.");
    } finally {
      setBusyId(null);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shippingFee = computeShippingFee(subtotal);
  const total = subtotal + shippingFee;

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-sans text-3xl font-bold">Giỏ hàng</h1>
      <p className="mt-1 text-muted-foreground">Bạn có {items.length} sản phẩm trong giỏ hàng</p>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl bg-card py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-sans text-xl font-bold">Giỏ hàng trống</h2>
          <p className="mt-1 text-muted-foreground">Hãy khám phá các sản phẩm mỹ phẩm chính hãng của chúng tôi.</p>
          <Button asChild className="mt-6">
            <Link href="/san-pham">
              <ShoppingBag className="mr-2 h-4 w-4" />Mua sắm ngay
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl bg-card p-4 shadow-sm">
                <Link href={`/san-pham/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? <Image src={item.image} alt={item.title} fill className="object-cover" sizes="96px" /> : null}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.brand ? <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.brand}</p> : null}
                      <Link href={`/san-pham/${item.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-primary">
                        {item.title}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(item)}
                      disabled={busyId === item.id}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        onClick={() => updateQty(item, item.quantity - 1)}
                        disabled={busyId === item.id || item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-40"
                        aria-label="Giảm"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item, item.quantity + 1)}
                        disabled={busyId === item.id || item.quantity >= item.stock}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-40"
                        aria-label="Tăng"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-sans font-bold text-primary">{formatPrice(item.lineTotal)}</div>
                      <div className="text-xs text-muted-foreground">{formatPrice(item.unitPrice)} / sp</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-card p-6 shadow-sm">
              <h2 className="font-sans text-lg font-bold">Tóm tắt đơn hàng</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium">{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 ? (
                  <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Mua thêm {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} để được miễn phí vận chuyển!
                  </div>
                ) : null}
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Tổng cộng</span>
                    <span className="font-sans text-xl font-extrabold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/thanh-toan")}>
                Tiến hành thanh toán
              </Button>
              <Button variant="ghost" className="mt-2 w-full" asChild>
                <Link href="/san-pham">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
