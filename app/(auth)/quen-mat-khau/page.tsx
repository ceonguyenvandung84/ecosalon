"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Đã có lỗi xảy ra");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold">Quên mật khẩu</h1>
      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-secondary/60 p-4 text-sm leading-relaxed">
            <p>Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.</p>
            <p className="mt-2 text-muted-foreground">Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).</p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/dang-nhap" className="font-medium text-primary hover:underline">Quay lại đăng nhập</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" placeholder="email@example.com" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi liên kết"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/dang-nhap" className="font-medium text-primary hover:underline">Quay lại đăng nhập</Link>
          </p>
        </>
      )}
    </div>
  );
}
