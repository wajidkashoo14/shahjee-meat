import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Gift, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyOrders, getRecommendedProducts } from "@/server/account";
import { formatJpy } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ReorderButton } from "@/components/account/reorder-button";
import { ProductRow } from "@/components/shop/product-row";
import { toCardData } from "@/server/catalog";

export default async function AccountOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.overview");
  const tOrders = await getTranslations("account.orders");

  const [orders, recommended] = await Promise.all([
    getMyOrders(session!.user.id),
    getRecommendedProducts(4),
  ]);
  const latest = orders[0];
  const pointsBalance = (session!.user as { pointsBalance?: number }).pointsBalance ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-sm text-foreground-muted">
              <Package className="size-4" /> {t("latestOrder")}
            </p>
            {latest ? (
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{latest.orderNumber}</p>
                  <OrderStatusBadge status={latest.status} />
                </div>
                <p className="mt-1 text-sm text-foreground-muted">{formatJpy(latest.totalJpy)}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/account/orders/${latest.id}`}>{tOrders("viewDetails")}</Link>
                  </Button>
                  <ReorderButton orderId={latest.id} size="sm" />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-foreground-muted">{t("noOrders")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-sm text-foreground-muted">
              <Gift className="size-4" /> {t("pointsBalance")}
            </p>
            <p className="mt-3 font-display text-3xl">{pointsBalance.toLocaleString()} pt</p>
            <Button size="sm" variant="secondary" className="mt-4" asChild>
              <Link href="/account/rewards">{t("viewRewards")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 font-display text-xl">{t("recommendedForYou")}</h2>
        <ProductRow items={recommended.map((p) => toCardData(p))} />
      </div>
    </div>
  );
}
