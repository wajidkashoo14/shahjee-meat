import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { ChevronLeft, Truck, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderForUser } from "@/server/account";
import { formatJpy } from "@/lib/utils";
import { isOrderCancellable } from "@/lib/order-status";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderTimeline } from "@/components/account/order-timeline";
import { ReorderButton } from "@/components/account/reorder-button";
import { CancelOrderButton } from "@/components/account/cancel-order-button";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.orders");
  const locale = await getLocale();

  const order = await getOrderForUser(id, session!.user.id);
  if (!order) notFound();

  const canCancel = isOrderCancellable(order);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/account/orders" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ChevronLeft className="size-4" /> {t("backToOrders")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-foreground-muted">
            {t("placedOn", { date: order.createdAt.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US") })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>

      {order.trackingNumber && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Truck className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {t("carrier")}: {order.carrier === "yamato" ? "Yamato Transport" : "Sagawa Express"}
              </p>
              <p className="text-sm text-foreground-muted">
                {t("tracking")}: {order.trackingNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">{t("itemsInThisOrder")}</p>
          <ul className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                  {item.image && <Image src={item.image} alt={item.nameEn} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{locale === "ja" ? item.nameJa : item.nameEn}</p>
                  <p className="text-foreground-muted">
                    {locale === "ja" ? item.variantLabelJa : item.variantLabelEn} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums">{formatJpy(item.lineTotalJpy)}</p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex flex-col gap-1 text-sm">
            <Row label="Subtotal" value={formatJpy(order.subtotalJpy)} />
            {order.discountJpy > 0 && <Row label="Discount" value={`−${formatJpy(order.discountJpy)}`} />}
            <Row label="Shipping" value={formatJpy(order.shippingJpy)} />
            <Row label="Total" value={formatJpy(order.totalJpy)} bold />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <ReorderButton orderId={order.id} />
        <Button variant="outline" asChild>
          <Link href={`/account/orders/${order.id}/receipt`} target="_blank">
            <Download className="size-4" /> {t("downloadReceipt")}
          </Link>
        </Button>
        {canCancel && <CancelOrderButton orderId={order.id} />}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : "text-foreground-muted"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
