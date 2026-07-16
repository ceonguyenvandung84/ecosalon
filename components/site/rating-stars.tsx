import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function RatingStarsImpl({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const r = rating ?? 0;
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= Math.round(r)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

export const RatingStars = memo(RatingStarsImpl);
