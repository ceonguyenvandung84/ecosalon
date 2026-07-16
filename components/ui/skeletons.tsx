import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-1 h-4 w-16" />
    </div>
  );
}

export function ChartPanelSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 flex h-64 items-end gap-2 px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4 border-b border-border pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
