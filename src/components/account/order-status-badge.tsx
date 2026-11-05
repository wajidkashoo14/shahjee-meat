import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  paid: "bg-primary/20 text-accent",
  packing: "bg-foreground/10 text-foreground",
  shipped: "bg-foreground/10 text-foreground",
  delivered: "bg-foreground text-background",
  cancelled: "bg-foreground-muted/20 text-foreground-muted",
  refunded: "bg-primary text-primary-foreground",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("account.orders.status");
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", COLORS[status] ?? "bg-surface-raised")}>
      {t(status as never)}
    </span>
  );
}
