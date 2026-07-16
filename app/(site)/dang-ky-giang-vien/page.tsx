"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Application {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  bio: string | null;
  expertise: string[];
  experience: string | null;
  motivation: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const emptyForm = { bio: "", expertise: "", experience: "", motivation: "" };

export default function InstructorApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/instructor/apply");
      if (res.ok) {
        const d = await res.json();
        setApp(d.application);
        if (d.application) {
          setForm({
            bio: d.application.bio || "",
            expertise: Array.isArray(d.application.expertise) ? d.application.expertise.join(", ") : "",
            experience: d.application.experience || "",
            motivation: d.application.motivation || "",
          });
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/dang-nhap?callbackUrl=/dang-ky-giang-vien");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bio.trim() || !form.experience.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setSaving(true);
    try {
      const expertiseArr = form.expertise.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/instructor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          expertise: expertiseArr,
          experience: form.experience,
          motivation: form.motivation,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đã gửi đơn ứng tuyển!");
        load();
      } else {
        toast.error(d?.error || "Thất bại");
      }
    } catch { toast.error("Lỗi"); }
    finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!session?.user) return null;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Đăng ký làm Giảng viên</h1>
          <p className="text-muted-foreground text-sm">Trở thành giảng viên và chia sẻ kiến thức của bạn</p>
        </div>
      </div>

      {app?.status === "PENDING" && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Đơn đang chờ duyệt</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Đơn ứng tuyển của bạn đang được xem xét. Chúng tôi sẽ thông báo khi có kết quả.
              </p>
            </div>
          </div>
        </div>
      )}

      {app?.status === "APPROVED" && (
        <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Đơn đã được duyệt!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Bạn đã trở thành giảng viên. Hãy bắt đầu tạo khóa học đầu tiên của bạn!
              </p>
              <Link href="/instructor/khoa-hoc">
                <Button size="sm" className="mt-2">Quản lý khóa học</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {app?.status === "REJECTED" && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Đơn bị từ chối</p>
              {app.adminNote && <p className="text-sm text-red-700 dark:text-red-300 mt-1">Lý do: {app.adminNote}</p>}
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">Bạn có thể nộp lại đơn với thông tin bổ sung.</p>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-xl p-6 bg-card">
        <h2 className="font-semibold mb-4">{app?.status === "PENDING" ? "Cập nhật đơn" : "Nộp đơn ứng tuyển"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bio">Giới thiệu bản thân *</Label>
            <Textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Mô tả về bản thân, kinh nghiệm và chuyên môn của bạn..."
              disabled={app?.status === "PENDING"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expertise">Chuyên môn *</Label>
            <Input
              id="expertise"
              value={form.expertise}
              onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              placeholder="VD: Lập trình Web, Thiết kế UI/UX, Marketing"
              disabled={app?.status === "PENDING"}
            />
            <p className="text-xs text-muted-foreground">Phân cách bằng dấu phẩy</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="experience">Kinh nghiệm *</Label>
            <Textarea
              id="experience"
              rows={3}
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              placeholder="Mô tả kinh nghiệm làm việc và giảng dạy của bạn..."
              disabled={app?.status === "PENDING"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivation">Lý do muốn làm giảng viên</Label>
            <Textarea
              id="motivation"
              rows={3}
              value={form.motivation}
              onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
              placeholder="Tại sao bạn muốn trở thành giảng viên trên nền tảng của chúng tôi?"
              disabled={app?.status === "PENDING"}
            />
          </div>
          {app?.status !== "PENDING" && (
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi đơn"}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}