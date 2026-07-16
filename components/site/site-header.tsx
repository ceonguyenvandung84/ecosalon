"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, User, Heart, BookOpen, LogOut, LayoutDashboard, ChevronDown, ShoppingCart, Package, Megaphone, Award, GraduationCap, Bookmark } from "lucide-react";
import { Logo } from "./logo";
import { useCart } from "./cart-provider";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/khoa-hoc", label: "Khóa học" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/tiep-thi-lien-ket", label: "Tiếp thị liên kết" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/dien-dan", label: "Diễn đàn" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { count: cartCount } = useCart();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/tim-kiem?q=${encodeURIComponent(term)}` : "/tim-kiem");
    setMobileOpen(false);
  }

  function initials(name?: string | null) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return (parts[parts.length - 1]?.[0] ?? "U").toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg whitespace-nowrap px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "text-primary" : "text-foreground/70 hover:text-primary hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm khóa học, sản phẩm..."
            aria-label="Tìm kiếm"
            className="pl-9"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/gio-hang"
            aria-label="Giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-accent"
          >
            <ShoppingCart className="h-5 w-5 text-foreground/80" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <NotificationBell />
          <ThemeToggle />
          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 shadow-sm transition-colors hover:bg-accent">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {initials(user?.name)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate font-semibold">{user?.name}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/ho-so"><User className="mr-2 h-4 w-4" />Hồ sơ của tôi</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/khoa-hoc-cua-toi"><BookOpen className="mr-2 h-4 w-4" />Khóa học của tôi</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/khoa-hoc/chung-chi"><Award className="mr-2 h-4 w-4" />Chứng chỉ</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/don-hang"><Package className="mr-2 h-4 w-4" />Đơn hàng của tôi</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/yeu-thich"><Heart className="mr-2 h-4 w-4" />Sản phẩm yêu thích</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/yeu-thich-khoa-hoc"><Bookmark className="mr-2 h-4 w-4" />Khóa học yêu thích</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/tiep-thi-lien-ket"><Megaphone className="mr-2 h-4 w-4" />Tiếp thị liên kết</Link></DropdownMenuItem>
                {user?.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Trang quản trị</Link></DropdownMenuItem>
                  </>
                )}
                {(user?.role === "INSTRUCTOR" || user?.role === "ADMIN") && (
                  <DropdownMenuItem asChild><Link href="/instructor"><GraduationCap className="mr-2 h-4 w-4" />Dashboard giảng viên</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild><Link href="/dang-nhap">Đăng nhập</Link></Button>
              <Button asChild><Link href="/dang-ky">Đăng ký</Link></Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
               <Button variant="outline" size="icon" aria-label="Mở menu" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-2"><Logo /></div>
              <form onSubmit={submitSearch} className="relative mt-6">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." aria-label="Tìm kiếm" className="pl-9" />
              </form>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-accent hover:text-primary">
                    {item.label}
                  </Link>
                ))}
              </nav>
              {status !== "authenticated" && (
                <div className="mt-6 flex flex-col gap-2">
                  <Button asChild onClick={() => setMobileOpen(false)}><Link href="/dang-ky">Đăng ký</Link></Button>
                  <Button variant="outline" asChild onClick={() => setMobileOpen(false)}><Link href="/dang-nhap">Đăng nhập</Link></Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
