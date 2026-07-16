import { memo } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

function LogoImpl({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Leaf className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight whitespace-nowrap">
          <div className="font-display text-lg font-extrabold tracking-tight text-primary">
            SALON HAIR SYSTEM
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Đào tạo • Mỹ phẩm • Cộng đồng
          </div>
        </div>
      )}
    </Link>
  );
}

export const Logo = memo(LogoImpl);
