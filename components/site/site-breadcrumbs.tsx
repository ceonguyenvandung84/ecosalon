import { memo } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

function SiteBreadcrumbsImpl({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Trang chủ</span>
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export const SiteBreadcrumbs = memo(SiteBreadcrumbsImpl);