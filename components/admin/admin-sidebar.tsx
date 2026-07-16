"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Home, ChevronDown, Menu, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/logo";
import { NotificationBell } from "@/components/site/notification-bell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { menuGroups, type MenuGroup, type MenuItem } from "./menu-config";
import { useEffect, useState, useCallback } from "react";

type BadgeMap = Record<string, number>;

// Check if an item's href matches the current route exactly (path + query params).
function isActive(href: string, pathname: string, searchParams: URLSearchParams | null): boolean {
  const parts = href.split("?");
  const basePath = parts[0] ?? "";
  const queryString = parts[1];
  if (pathname !== basePath) return false;
  if (!queryString) return searchParams ? searchParams.toString() === "" : true;
  if (!searchParams) return false;
  const params = new URLSearchParams(queryString);
  for (const [key, val] of params) {
    if (searchParams.get(key) !== val) return false;
  }
  return true;
}

// Check if a pathname is a sub-path of the item's href (for detail pages, e.g. /admin/don-hang/123).
// Only returns true if pathname is LONGER than href (not same path with different query params).
// Also skips items that have query params in their href.
function startsWithHref(href: string, pathname: string): boolean {
  if (href.includes("?")) return false;
  const basePath = href.split("?")[0] ?? "";
  if (href === "/admin") return pathname === "/admin";
  if (pathname === basePath) return false;
  return pathname.startsWith(basePath);
}

function isItemOrChildActive(item: MenuItem, pathname: string, searchParams: URLSearchParams | null): boolean {
  if (isActive(item.href, pathname, searchParams) || startsWithHref(item.href, pathname)) return true;
  if (item.children) {
    return item.children.some((child) => isActive(child.href, pathname, searchParams) || startsWithHref(child.href, pathname));
  }
  return false;
}

function isGroupActive(group: MenuGroup, pathname: string, searchParams: URLSearchParams | null): boolean {
  if (group.href && (isActive(group.href, pathname, searchParams) || startsWithHref(group.href, pathname))) return true;
  return group.items.some((item) => isItemOrChildActive(item, pathname, searchParams));
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openGroups, setOpenGroups] = useState<Set<number>>(() => new Set());
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set());
  const [badges, setBadges] = useState<BadgeMap>({});

  const paramsStr = searchParams?.toString() ?? "";
  useEffect(() => {
    const nextGroups = new Set<number>();
    const nextItems = new Set<string>();
    menuGroups.forEach((g, i) => {
      if (isGroupActive(g, pathname, searchParams)) nextGroups.add(i);
      g.items.forEach((item) => {
        if (item.children && item.children.some((child) => isActive(child.href, pathname, searchParams) || startsWithHref(child.href, pathname))) {
          nextItems.add(item.href);
        }
      });
    });
    setOpenGroups(nextGroups);
    setOpenItems(nextItems);
  }, [pathname, paramsStr]);

  useEffect(() => {
    fetch("/api/admin/menu-badges")
      .then((r) => r.json())
      .then((d) => setBadges(d ?? {}))
      .catch(() => {});
  }, []);

  const toggleGroup = useCallback((index: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleItem = useCallback((href: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-2 py-3"><Logo /><NotificationBell /></div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto scroll-smooth overscroll-contain pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
        {menuGroups.map((group, gi) => {
          const expanded = openGroups.has(gi);
          const groupActive = isGroupActive(group, pathname, searchParams);
          return (
            <div key={group.title} className="mb-0.5">
              <button
                onClick={() => toggleGroup(gi)}
                aria-expanded={expanded}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-100 active:scale-[0.98]",
                  groupActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <group.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{group.title}</span>
                {group.href && (
                  <Link
                    href={group.href}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-primary hover:bg-secondary/80 transition-colors"
                    aria-label="Xem tổng quan" title="Xem tổng quan"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-100", expanded && "rotate-0", !expanded && "-rotate-90")} />
              </button>
              {expanded && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2 pb-1">
                  {group.items.map((item: MenuItem) => {
                    const active = isActive(item.href, pathname, searchParams) || startsWithHref(item.href, pathname);
                    const hasChildren = !!(item.children && item.children.length > 0);
                    const itemExpanded = openItems.has(item.href);
                    const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;
                    const isParentActive = isItemOrChildActive(item, pathname, searchParams);

                    if (hasChildren) {
                      return (
                        <div key={item.href}>
                          <button
                            onClick={() => toggleItem(item.href)}
                            aria-expanded={itemExpanded}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-100 active:scale-[0.98]",
                              isParentActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                            )}
                          >
                            <span className={cn("h-1 w-1 shrink-0 rounded-full bg-primary transition-opacity duration-100", isParentActive ? "opacity-100" : "opacity-0")} />
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            {badgeCount !== undefined && badgeCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[11px] font-medium">{badgeCount}</Badge>
                            )}
                            <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-100", itemExpanded ? "rotate-0" : "-rotate-90")} />
                          </button>
                          {itemExpanded && item.children && (
                            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2 pb-1">
                              {item.children.map((child: MenuItem) => {
                                const childActive = isActive(child.href, pathname, searchParams) || startsWithHref(child.href, pathname);
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-100 active:scale-[0.98]",
                                      childActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    )}
                                  >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                                    <span className="flex-1 truncate">{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-100 active:scale-[0.98]",
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        )}
                      >
                        <span className={cn("h-1 w-1 shrink-0 rounded-full bg-primary transition-opacity duration-100", active ? "opacity-100" : "opacity-0")} />
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[11px] font-medium">{badgeCount}</Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-border pt-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-100 hover:bg-secondary hover:text-foreground active:scale-[0.98]"><Home className="h-5 w-5" /> Về trang chủ</Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-100 hover:bg-destructive/10 active:scale-[0.98]"><LogOut className="h-5 w-5" /> Đăng xuất</button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Mở menu" className="fixed left-4 top-3 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-80 flex-col p-4">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-border bg-card p-4 md:flex">
        <SidebarContent />
      </aside>
    </>
  );
}
