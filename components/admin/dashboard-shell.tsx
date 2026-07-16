import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardCard {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  color: string;
  badge?: string;
}

interface RecentItemsSection {
  label: string;
  viewAllHref: string;
  items: { id: string; primary: string; secondary: string; href: string; badge?: { text: string; variant?: "default" | "secondary" | "destructive" } }[];
  emptyText: string;
}

interface DashboardShellProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
  loading?: boolean;
  cards: DashboardCard[];
  recent: RecentItemsSection[];
}

export function DashboardShell({ title, description, action, loading, cards, recent }: DashboardShellProps) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between"><c.icon className={`h-6 w-6 ${c.color}`} /></div>
                <div className="mt-3 font-sans text-2xl font-bold">{formatNumber(c.value)}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  {c.badge && <Badge variant="destructive" className="text-[10px] px-1.5">{c.badge}</Badge>}
                </div>
              </Link>
            ))}
          </div>

          {recent.map((section) => (
            <div key={section.label} className="mt-6 rounded-xl bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">{section.label}</h2>
                <Link href={section.viewAllHref} className="text-sm text-primary hover:underline flex items-center gap-1">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>
              </div>
              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{section.emptyText}</p>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2.5 hover:bg-secondary/60 transition-colors">
                      <div>
                        <div className="font-medium">{item.primary}</div>
                        <div className="text-xs text-muted-foreground">{item.secondary}</div>
                      </div>
                      {item.badge && (
                        <div className="flex items-center gap-3">
                          <Badge variant={item.badge.variant ?? "default"}>{item.badge.text}</Badge>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
