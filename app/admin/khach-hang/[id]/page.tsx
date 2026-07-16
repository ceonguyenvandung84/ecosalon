"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Mail, Phone, CalendarDays, Wallet, ShoppingBag,
  GraduationCap, StickyNote, Trash2, Send, Tag, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/orders";
import { CUSTOMER_TAGS } from "@/lib/crm";
import type { CustomerDetailItem } from "@/lib/types";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [c, setC] = useState<CustomerDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTags, setSavingTags] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((d) => setC(d?.customer ?? null))
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { if (id) load(); }, [id, load, setLoading, setC]);

  const toggleTag = async (value: string) => {
    if (!c) return;
    const has = (c.tags ?? []).includes(value);
    const next = has ? c.tags.filter((t) => t !== value) : [...(c.tags ?? []), value];
    setC({ ...c, tags: next });
    setSavingTags(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      if (!res.ok) throw new Error();
      load();
    } catch {
      toast.error("Không thể cập nhật thẻ");
      load();
    } finally {
      setSavingTags(false);
    }
  };

  const addNote = async () => {
    const content = noteText.trim();
    if (!content) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setC((prev) => ({ ...(prev as CustomerDetailItem), notes: [data.note, ...(prev?.notes ?? [])] }));
      setNoteText("");
      toast.success("Đã thêm ghi chú");
    } catch {
      toast.error("Không thể thêm ghi chú");
    } finally {
      setAddingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setC((prev) => ({ ...(prev as CustomerDetailItem), notes: (prev?.notes ?? []).filter((n) => n.id !== noteId) }));
    } catch {
      toast.error("Không thể xóa ghi chú");
    }
  };

  function initials(name?: string) {
    if (!name) return "K";
    const parts = name.trim().split(" ");
    return (parts[parts.length - 1]?.[0] ?? "K").toUpperCase();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!c) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-12 text-center">
        <p className="text-muted-foreground">Không tìm thấy khách hàng.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/khach-hang")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Tổng chi tiêu", value: formatPrice(c.totalSpent), icon: Wallet },
    { label: "Đơn đã thanh toán", value: formatNumber(c.paidOrderCount), icon: ShoppingBag },
    { label: "Tổng đơn hàng", value: formatNumber(c.orderCount), icon: ShoppingBag },
    { label: "Khóa học", value: formatNumber(c.enrollmentCount), icon: GraduationCap },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin/khach-hang" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Danh sách khách hàng
      </Link>

      {/* Profile header */}
      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary">
            {c.avatar ? (
              <Image src={c.avatar} alt={c.fullName} fill className="object-cover" sizes="64px" />
            ) : (
              initials(c.fullName)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-xl font-bold">{c.fullName}</h1>
              {c.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3 w-3" />Hoạt động</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Đã khóa</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.email}</span>
              {c.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{c.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Tham gia {formatDate(c.createdAt)}</span>
            </div>
            {c.bio && <p className="mt-2 text-sm text-muted-foreground">{c.bio}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
                <s.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-sans text-base font-bold leading-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Orders */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-sans font-bold"><ShoppingBag className="h-4 w-4 text-primary" />Đơn hàng</h2>
            {c.orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chưa có đơn hàng.</p>
            ) : (
              <div className="divide-y">
                {c.orders.map((o) => (
                  <Link key={o.id} href={`/admin/don-hang/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.orderCode}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(o.itemCount)} sản phẩm · {formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("shrink-0", ORDER_STATUS_COLORS[o.status])}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                      <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Enrollments */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-sans font-bold"><GraduationCap className="h-4 w-4 text-primary" />Khóa học đã ghi danh</h2>
            {c.enrollments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Chưa ghi danh khóa học nào.</p>
            ) : (
              <div className="divide-y">
                {c.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">Ghi danh {formatDate(e.enrolledAt)}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{formatNumber(e.progress)}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Tags */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-sans font-bold">
              <Tag className="h-4 w-4 text-primary" />Phân nhóm / Thẻ
              {savingTags && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </h2>
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_TAGS.map((t) => {
                const active = (c.tags ?? []).includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTag(t.value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition",
                      active ? t.color : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Nhấn để gắn hoặc bỏ thẻ cho khách hàng.</p>
          </div>

          {/* Notes */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-sans font-bold"><StickyNote className="h-4 w-4 text-primary" />Ghi chú nội bộ</h2>
            <div className="space-y-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Thêm ghi chú về khách hàng này..."
                rows={3}
              />
              <Button size="sm" className="w-full" onClick={addNote} disabled={addingNote || !noteText.trim()}>
                {addingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Lưu ghi chú
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {(c.notes ?? []).length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">Chưa có ghi chú nào.</p>
              ) : (
                c.notes.map((n) => (
                  <div key={n.id} className="group rounded-lg bg-secondary/50 p-3">
                    <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{n.author?.fullName ?? "Quản trị"} · {formatDate(n.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => { if (!confirm("Bạn có chắc muốn xóa ghi chú này?")) return; deleteNote(n.id); }}
                        className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                        title="Xóa ghi chú"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
