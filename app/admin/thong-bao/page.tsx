"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getNotificationMeta } from "@/lib/notifications";
import type { NotificationItem } from "@/lib/types";

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", link: "", allUsers: false });
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d?.notifications ?? []))
      .catch((e) => { console.error("Failed to load notifications", e); toast.error("Không thể tải thông báo."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, setLoading]);

  const send = async () => {
    if (!form.title || !form.message) { toast.error("Nhập tiêu đề và nội dung"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`Đã gửi đến ${d.sentCount} người dùng`);
        setOpen(false);
        setForm({ title: "", message: "", link: "", allUsers: false });
      } else {
        toast.error(d?.error ?? "Gửi thất bại");
      }
    } catch { toast.error("Lỗi"); }
    finally { setSending(false); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-sans text-2xl font-bold">Thông báo</h1><p className="text-muted-foreground">{items.length} thông báo</p></div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Send className="h-4 w-4" /> Gửi thông báo</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Bell className="mb-3 h-10 w-10" />
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Loại</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Người nhận</TableHead><TableHead>Ngày</TableHead><TableHead>Đã xem</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.map((n) => {
                const meta = getNotificationMeta(n.type);
                return (
                  <TableRow key={n.id}>
                    <TableCell>
                      <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="font-medium">{n.title}</span>
                        {n.message ? <span className="text-xs text-muted-foreground truncate">{n.message}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{n.user?.fullName || n.user?.email || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge variant={n.isRead ? "secondary" : "default"}>{n.isRead ? "Rồi" : "Chưa"}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gửi thông báo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Nội dung *</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Link (tùy chọn)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/khoa-hoc/..." /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.allUsers} onCheckedChange={(v) => setForm({ ...form, allUsers: v })} />
              <Label>Gửi cho tất cả người dùng (thay vì chỉ admin)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
