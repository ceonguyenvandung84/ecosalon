"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        toast.error("Email hoặc mật khẩu không đúng");
      } else {
        toast.success("Đăng nhập thành công");
        router.replace(callbackUrl);
      }
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chào mừng bạn quay lại!</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" placeholder="email@example.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="••••••••" />
          </div>
        </div>
        <div className="flex justify-end">
          <Link href="/quen-mat-khau" className="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản? <Link href="/dang-ky" className="font-medium text-primary hover:underline">Đăng ký ngay</Link>
      </p>
    </div>
  );
}
