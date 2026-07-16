"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((password ?? "").length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data?.error ?? "Liên kết không hợp lệ hoặc đã hết hạn"); setLoading(false); return; }
      toast.success("Đặt lại mật khẩu thành công");
      router.replace("/dang-nhap");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold">Đặt lại mật khẩu</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="Tối thiểu 6 ký tự" />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đặt lại mật khẩu"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/dang-nhap" className="font-medium text-primary hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
