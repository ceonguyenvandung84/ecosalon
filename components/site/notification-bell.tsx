"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  BadgeCheck,
  Package,
  GraduationCap,
  MessageSquare,
  MessageCircle,
  Coins,
  Megaphone,
  Wallet,
  CheckCheck,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotificationMeta } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Bell,
  BadgeCheck,
  Package,
  GraduationCap,
  MessageSquare,
  MessageCircle,
  Coins,
  Megaphone,
  Wallet,
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
}

export function NotificationBell({ className }: { className?: string }) {
  const { status } = useSession() || {};
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* im lặng */
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setUnread(0);
      return;
    }
    fetchData();
    function tick() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchData();
      }
    }
    timer.current = setInterval(tick, 25000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, fetchData, setItems, setUnread]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }

  async function onItemClick(n: NotificationItem) {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  if (status !== "authenticated") return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Thông báo"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-accent",
            className
          )}
        >
          <Bell className="h-5 w-5 text-foreground/80" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-sans text-sm font-bold">Thông báo</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Đánh dấu đã đọc
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              Chưa có thông báo nào.
            </div>
          ) : (
            items.map((n) => {
              const meta = getNotificationMeta(n.type);
              const Icon = ICONS[meta.icon] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{n.title}</span>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
