import { headers } from "next/headers";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyOrders } from "@/server/account";
import { formatJpy } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.orders");
  const locale = await getLocale();
  const orders = await getMyOrders(session!.user.id);

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium">{order.orderNumber}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-foreground-muted">
                {t("placedOn", { date: order.createdAt.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US") })} ·{" "}
                {order.items.length} {order.items.length === 1 ? "item" : "items"} · {formatJpy(order.totalJpy)}
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/account/orders/${order.id}`}>{t("viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
