"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((password ?? "").length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    setLoading(true);
    try {
      const refCode = (() => {
        try {
          const m = document.cookie.match(/(?:^|; )shs_ref=([^;]+)/);
          return m ? decodeURIComponent(m[1]!) : "";
        } catch { return ""; }
      })();
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, refCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data?.error ?? "Đăng ký thất bại"); setLoading(false); return; }
      const login = await signIn("credentials", { email, password, redirect: false });
      if (login?.error) { toast.error("Đăng nhập tự động thất bại, vui lòng đăng nhập"); router.replace("/dang-nhap"); return; }
      toast.success("Tạo tài khoản thành công");
      router.replace("/");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold">Đăng ký</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản để bắt đầu học.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Họ tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="pl-11" placeholder="Nguyễn Văn A" />
          </div>
        </div>
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
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="Tối thiểu 6 ký tự" />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng ký"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản? <Link href="/dang-nhap" className="font-medium text-primary hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
