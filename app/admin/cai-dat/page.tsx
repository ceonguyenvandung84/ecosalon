"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Save, Settings, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const generalFields = [
  { key: "site_name", label: "Tên website" },
  { key: "site_tagline", label: "Khẩu hiệu" },
  { key: "contact_email", label: "Email liên hệ" },
  { key: "contact_phone", label: "Số điện thoại" },
  { key: "contact_address", label: "Địa chỉ" },
];

const quizFields = [
  { key: "quiz_default_pass_percent", label: "Điểm đạt (%)", placeholder: "70", type: "number" },
  { key: "quiz_default_time_limit", label: "Thời gian mặc định (phút)", placeholder: "30", type: "number" },
  { key: "quiz_default_attempt_limit", label: "Số lần làm tối đa", placeholder: "3", type: "number" },
];

const socialFields = [
  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "social_youtube", label: "Youtube", placeholder: "https://youtube.com/..." },
  { key: "social_zalo", label: "Zalo", placeholder: "https://zalo.me/..." },
  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
];

const bankFields = [
  { key: "bank_code", label: "Mã ngân hàng (VietQR)", placeholder: "VD: VCB, TCB, MB, ACB..." },
  { key: "bank_name", label: "Tên ngân hàng", placeholder: "VD: Vietcombank" },
  { key: "bank_account_number", label: "Số tài khoản", placeholder: "VD: 1027391102" },
  { key: "bank_account_name", label: "Tên chủ tài khoản", placeholder: "VD: SALON HAIR SYSTEM" },
];

const commissionFields = [
  { key: "commission_default_rate", label: "Hoa hồng mặc định (%)", placeholder: "10", type: "number" },
  { key: "commission_min_payout", label: "Rút tiền tối thiểu", placeholder: "200000", type: "number" },
  { key: "commission_hold_days", label: "Thời gian đóng băng (ngày)", placeholder: "30", type: "number" },
  { key: "commission_cookie_ttl", label: "Thời gian sống Cookie (ngày)", placeholder: "30", type: "number" },
];

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-6 bg-card mb-6">
      <h2 className="font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

const TABS = [
  { value: "general", label: "Cấu hình", icon: Settings },
  { value: "rbac", label: "Phân quyền", icon: Shield },
  { value: "commission", label: "Hoa hồng", icon: DollarSign },
];

function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "general";

  const [form, setForm] = useState<Record<string, string>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const settings = d?.settings ?? {};
        setForm(settings);
        setMaintenanceMode(settings.maintenance_mode === "true");
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, maintenance_mode: maintenanceMode ? "true" : "false" };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast.success("Đã lưu cài đặt");
      else toast.error("Lưu thất bại");
    } catch { toast.error("Lỗi"); }
    finally { setSaving(false); }
  };

  const setTab = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "general") params.delete("tab");
    else params.set("tab", v);
    router.replace(`/admin/cai-dat${params.toString() ? "?" + params.toString() : ""}`);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sans text-2xl font-bold">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý cấu hình website.</p>
        </div>
        {tab === "general" && (
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu thay đổi
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              <t.icon className="h-4 w-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "general" && (
        loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <SettingsSection title="Chung">
              <div className="space-y-4">
                {generalFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <Label className="md:col-span-1">{f.label}</Label>
                    <Input
                      className="md:col-span-2"
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.label}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-t mt-2">
                  <div>
                    <Label>Chế độ bảo trì</Label>
                    <p className="text-xs text-muted-foreground">Khi bật, chỉ admin mới truy cập được website.</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={(v) => setMaintenanceMode(v)} />
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Quiz mặc định">
              <p className="text-sm text-muted-foreground mb-4">Các giá trị này sẽ được áp dụng mặc định khi tạo quiz mới.</p>
              <div className="space-y-4">
                {quizFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <Label className="md:col-span-1">{f.label}</Label>
                    <Input
                      className="md:col-span-2"
                      type={f.type || "text"}
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="Mạng xã hội">
              <div className="space-y-4">
                {socialFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <Label className="md:col-span-1">{f.label}</Label>
                    <Input
                      className="md:col-span-2"
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="Thông tin thanh toán">
              <div className="space-y-4">
                {bankFields.map((f) => (
                  <div key={f.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <Label className="md:col-span-1">{f.label}</Label>
                    <Input
                      className="md:col-span-2"
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </SettingsSection>
          </>
        )
      )}

      {tab === "rbac" && (
        <SettingsSection title="Phân quyền nhân viên">
          <p className="text-sm text-muted-foreground mb-4">Quản lý vai trò và quyền hạn của nhân viên trong hệ thống.</p>
          <div className="space-y-4">
            {[
              { role: "Admin", desc: "Toàn quyền truy cập hệ thống", users: 1 },
              { role: "Editor", desc: "Quản lý nội dung, bài viết, blog", users: 0 },
              { role: "Moderator", desc: "Kiểm duyệt diễn đàn và bình luận", users: 0 },
              { role: "Accountant", desc: "Xem báo cáo tài chính, đối soát", users: 0 },
              { role: "Teacher", desc: "Quản lý khóa học, bài học, quiz", users: 0 },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{r.role}</p>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <span className="text-sm text-muted-foreground">{r.users} người</span>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {tab === "commission" && (
        <SettingsSection title="Cấu hình Hoa hồng">
          <p className="text-sm text-muted-foreground mb-4">Thiết lập quy tắc hoa hồng cho hệ thống tiếp thị liên kết.</p>
          <div className="space-y-4">
            {commissionFields.map((f) => (
              <div key={f.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <Label className="md:col-span-1">{f.label}</Label>
                <Input
                  className="md:col-span-2"
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu thay đổi
            </Button>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}>
      <SettingsInner />
    </Suspense>
  );
}
