import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["paid", "packing", "shipped", "delivered"];

export function OrderTimeline({ status }: { status: string }) {
  const t = useTranslations("account.orders.status");
  if (status === "cancelled" || status === "refunded") {
    return <p className="text-sm font-medium text-foreground-muted">{t(status as never)}</p>;
  }
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                i <= currentIndex ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground-muted",
              )}
            >
              {i < currentIndex ? <Check className="size-4" /> : i + 1}
            </div>
            <span className={cn("text-xs", i <= currentIndex ? "text-foreground" : "text-foreground-muted")}>{t(step as never)}</span>
          </div>
          {i < STEPS.length - 1 && <div className={cn("mx-2 h-0.5 flex-1", i < currentIndex ? "bg-primary" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}
