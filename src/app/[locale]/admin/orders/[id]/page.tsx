import { notFound } from "next/navigation";
import Image from "next/image";
import { getOrderAdmin } from "@/server/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { FulfillDialog } from "@/components/admin/fulfill-dialog";
import { RefundDialog } from "@/components/admin/refund-dialog";
import { formatJpy } from "@/lib/utils";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderAdmin(id);
  if (!order) notFound();

  const refundedTotal = order.refunds.reduce((s, r) => s + r.amountJpy, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-foreground-muted">{order.createdAt.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusSelect orderId={order.id} status={order.status} />
          {order.status === "paid" && <FulfillDialog orderId={order.id} />}
          {order.status !== "refunded" && <RefundDialog orderId={order.id} maxAmount={order.totalJpy - refundedTotal} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 font-medium">Customer</p>
            <p className="text-sm">{order.email}</p>
            <Separator className="my-4" />
            <p className="mb-2 font-medium">Ship to</p>
            <p className="text-sm">{order.shippingName} ({order.shippingNameKana})</p>
            <p className="text-sm text-foreground-muted">{order.shippingPhone}</p>
            <p className="text-sm text-foreground-muted">
              〒{order.shippingPostalCode} {order.shippingPrefecture}{order.shippingCity} {order.shippingAddressLine1} {order.shippingAddressLine2}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 font-medium">Delivery</p>
            <p className="text-sm">{order.deliveryDate} — {order.deliverySlot}</p>
            {order.trackingNumber && (
              <p className="mt-2 text-sm text-foreground-muted">
                {order.carrier === "yamato" ? "Yamato Transport" : "Sagawa Express"}: {order.trackingNumber}
              </p>
            )}
            <Separator className="my-4" />
            <p className="mb-2 font-medium">Payment</p>
            <p className="text-sm capitalize text-foreground-muted">{order.paymentMethod}</p>
            {order.refunds.length > 0 && (
              <p className="mt-2 text-sm text-sale">Refunded: {formatJpy(refundedTotal)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">Items</p>
          <ul className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                  {item.image && <Image src={item.image} alt={item.nameEn} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.nameEn}</p>
                  <p className="text-foreground-muted">{item.variantLabelEn} × {item.quantity}</p>
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
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : "text-foreground-muted"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
