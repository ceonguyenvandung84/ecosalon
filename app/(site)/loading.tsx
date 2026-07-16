import { Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card shadow-sm overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
