import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ rating, count, size = "sm" }: { rating: number; count?: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(starSize, i < Math.round(rating) ? "fill-brass text-brass" : "fill-none text-foreground-muted/40")}
          />
        ))}
      </div>
      {count != null && <span className="text-xs text-foreground-muted">({count})</span>}
    </div>
  );
}
