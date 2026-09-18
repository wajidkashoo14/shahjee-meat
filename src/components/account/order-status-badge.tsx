import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  paid: "bg-brass/20 text-brass",
  packing: "bg-blue-500/20 text-blue-400",
  shipped: "bg-sage/20 text-sage",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-foreground-muted/20 text-foreground-muted",
  refunded: "bg-sale/20 text-sale",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("account.orders.status");
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", COLORS[status] ?? "bg-surface-raised")}>
      {t(status as never)}
    </span>
  );
}
