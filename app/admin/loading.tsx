import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6 lg:p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-sm">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
