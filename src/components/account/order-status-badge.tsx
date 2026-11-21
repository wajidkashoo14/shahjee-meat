import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Status → semantic color. Shared by the customer account and the admin.
const COLORS: Record<string, string> = {
  paid: "bg-foreground text-background",
  packing: "bg-warning-soft text-warning-soft-foreground",
  shipped: "bg-info-soft text-info-soft-foreground",
  delivered: "bg-success-soft text-success-soft-foreground",
  cancelled: "bg-surface-raised text-foreground-muted",
  refunded: "bg-danger-soft text-danger-soft-foreground",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("account.orders.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold before:size-1.5 before:rounded-full before:bg-current before:opacity-70",
        COLORS[status] ?? "bg-surface-raised text-foreground-muted",
      )}
    >
      {t(status as never)}
    </span>
  );
}
