"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, BookOpen, Heart, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/site/avatar-upload";
import { toast } from "sonner";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ fullName?: string; email?: string; avatar?: string; phone?: string; bio?: string; enrollmentsCount?: number; wishlistCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", avatarPath: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      const p = d?.profile;
      setProfile(p);
      if (p) setForm({ fullName: p?.fullName ?? "", phone: p?.phone ?? "", bio: p?.bio ?? "", avatarPath: "" });
    }).catch(() => { toast.error("Không thể tải dữ liệu."); }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { toast.success("Đã lưu thông tin"); setProfile((prev) => ({ ...(prev ?? {}), ...(d?.profile ?? {}) })); }
      else toast.error(d?.error ?? "Lưu thất bại");
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passwordForm) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đổi mật khẩu thành công");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(d?.error ?? "Đổi mật khẩu thất bại");
      }
    } catch { toast.error("Đã có lỗi xảy ra"); } finally { setSavingPassword(false); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Tài khoản</div>
      <h1 className="font-sans text-3xl font-bold">Hồ sơ của tôi</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="flex justify-center">
              <AvatarUpload value={profile?.avatar} name={profile?.fullName} onUploaded={(path) => setForm((f) => ({ ...f, avatarPath: path }))} />
            </div>
            <h2 className="mt-4 font-sans text-lg font-bold">{profile?.fullName}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/40 p-4 text-center"><BookOpen className="mx-auto mb-1 h-5 w-5 text-primary" /><div className="font-sans text-xl font-bold">{profile?.enrollmentsCount ?? 0}</div><div className="text-xs text-muted-foreground">Khóa học</div></div>
            <div className="rounded-xl bg-secondary/40 p-4 text-center"><Heart className="mx-auto mb-1 h-5 w-5 text-primary" /><div className="font-sans text-xl font-bold">{profile?.wishlistCount ?? 0}</div><div className="text-xs text-muted-foreground">Yêu thích</div></div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-sans text-lg font-bold">Thông tin cá nhân</h2>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Họ tên</Label><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Số điện thoại</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="09xx xxx xxx" /></div>
              <div className="space-y-2"><Label>Giới thiệu</Label><Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Đôi nét về bạn..." /></div>
              <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi</Button>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-bold">Đổi mật khẩu</h2>
              <button type="button" onClick={() => setShowPasswords((v) => !v)} className="text-muted-foreground hover:text-foreground" aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Mật khẩu hiện tại</Label><Input type={showPasswords ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Mật khẩu mới</Label><Input type={showPasswords ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Xác nhận mật khẩu mới</Label><Input type={showPasswords ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} /></div>
              <Button onClick={changePassword} disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword} className="gap-2">{savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Đổi mật khẩu</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
