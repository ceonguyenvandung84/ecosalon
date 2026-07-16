"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Search, Users2, Wallet, UserCheck, ChevronRight, Download, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";
import { CUSTOMER_TAGS, getTagDef, SPEND_TIERS, spendTier } from "@/lib/crm";
import type { CustomerAdminItem, CustomerSummary } from "@/lib/types";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerAdminItem[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>({ totalCustomers: 0, payingCustomers: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tag, setTag] = useState("all");
  const [tier, setTier] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d?.customers ?? []);
        setSummary(d?.summary ?? {});
      })
      .catch(() => { toast.error("Không thể tải dữ liệu."); })
      .finally(() => setLoading(false));
  }, [setLoading, setCustomers, setSummary]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q) { const hay = `${c.fullName} ${c.email} ${c.phone ?? ""}`.toLowerCase(); if (!hay.includes(q)) return false; }
      if (tag !== "all" && !(c.tags ?? []).includes(tag)) return false;
      if (tier !== "all" && spendTier(c.totalSpent) !== tier) return false;
      return true;
    });
  }, [customers, search, tag, tier]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, tag, tier, setPage]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const stats = [
    { label: "Tổng khách hàng", value: formatNumber(summary.totalCustomers ?? 0), icon: Users2, color: "text-sky-600 bg-sky-100" },
    { label: "Khách đã mua", value: formatNumber(summary.payingCustomers ?? 0), icon: UserCheck, color: "text-emerald-600 bg-emerald-100" },
    { label: "Tổng doanh thu", value: formatPrice(summary.totalRevenue ?? 0), icon: Wallet, color: "text-amber-600 bg-amber-100" },
  ];

  function initials(name?: string) {
    if (!name) return "K";
    const parts = name.trim().split(" ");
    return (parts[parts.length - 1]?.[0] ?? "K").toUpperCase();
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-2xl font-bold">Quản lý khách hàng (CRM)</h1>
            <p className="text-sm text-muted-foreground">Tổng quan, phân nhóm và chăm sóc khách hàng</p>
          </div>
          <a href="/api/admin/export?type=customers" download className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-sans text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm tên, email, sđt..." className="pl-9" />
        </div>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Thẻ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thẻ</SelectItem>
            {CUSTOMER_TAGS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Mức chi" /></SelectTrigger>
          <SelectContent>
            {SPEND_TIERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : paged.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Không có khách hàng phù hợp.</p>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Thẻ</TableHead>
                <TableHead className="text-center">Đơn hàng</TableHead>
                <TableHead className="text-center">Khóa học</TableHead>
                <TableHead className="text-right">Chi tiêu</TableHead>
                <TableHead>Hoạt động</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/khach-hang/${c.id}`} className="flex items-center gap-3">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {c.avatar ? (
                          <Image src={c.avatar} alt={c.fullName} fill className="object-cover" sizes="36px" />
                        ) : (
                          initials(c.fullName)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        (c.tags ?? []).map((t: string) => {
                          const def = getTagDef(t);
                          return <Badge key={t} className={cn("hover:opacity-100", def.color)}>{def.label}</Badge>;
                        })
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{formatNumber(c.orderCount)}</TableCell>
                  <TableCell className="text-center text-sm">{formatNumber(c.enrollmentCount)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{formatPrice(c.totalSpent)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.lastActivity)}</TableCell>
                  <TableCell>
                    <Link href={`/admin/khach-hang/${c.id}`} className="flex justify-end text-muted-foreground hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} / {formatNumber(filtered.length)}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="mx-2 text-sm text-muted-foreground">Trang {page}/{totalPages}</span>
                  <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
