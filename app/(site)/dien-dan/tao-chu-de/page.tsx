"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateThreadPage() {
  const router = useRouter();
  const { status } = useSession() || {};
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/forum").then((r) => r.json()).then((d) => setCategories(d?.categories ?? [])).catch((e) => console.error("Failed to load forum categories", e));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/dang-nhap");
  }, [status, router]);

  const submit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, categoryId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Lỗi");
      toast.success("Đã tạo chủ đề");
      router.push(`/dien-dan/${d.thread.slug}`);
    } catch {
      toast.error("Không thể tạo chủ đề");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/dien-dan" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Về diễn đàn</Link>
      <h1 className="mt-6 font-sans text-2xl font-bold">Tạo chủ đề mới</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chia sẻ câu hỏi hoặc kinh nghiệm của bạn với cộng đồng.</p>

      <div className="mt-8 space-y-5 rounded-2xl bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề chủ đề..." />
        </div>
        <div className="space-y-2">
          <Label>Chuyên mục</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Chọn chuyên mục" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Nội dung</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Viết nội dung chi tiết..." />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={submitting} size="lg">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Đăng chủ đề
          </Button>
        </div>
      </div>
    </div>
  );
}
