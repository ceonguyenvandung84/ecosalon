"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled = false,
  size = "lg",
  className,
  redirectTo,
  label = "Thêm vào giỏ hàng",
}: {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  size?: "sm" | "lg" | "default" | "icon";
  className?: string;
  redirectTo?: string;
  label?: string;
}) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (!session?.user) {
      router.push(`/dang-nhap?callbackUrl=${encodeURIComponent(redirectTo ?? "/san-pham")}`);
      return;
    }
    if (!productId) return;
    setLoading(true);
    const result = await addToCart(productId, quantity);
    setLoading(false);
    if (result === true) {
      setDone(true);
      toast.success("Đã thêm vào giỏ hàng");
      setTimeout(() => setDone(false), 1500);
    } else {
      if (result.includes("đăng nhập")) {
        router.push(`/dang-nhap?callbackUrl=${encodeURIComponent(redirectTo ?? "/san-pham")}`);
      }
      toast.error(result);
    }
  }

  return (
    <Button size={size} className={cn(className)} onClick={handleClick} disabled={disabled || loading}>
      {loading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : done ? (
        <Check className="mr-2 h-5 w-5" />
      ) : (
        <ShoppingCart className="mr-2 h-5 w-5" />
      )}
      {done ? "Đã thêm" : label}
    </Button>
  );
}
