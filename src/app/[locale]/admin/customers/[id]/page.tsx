import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomerAdmin } from "@/server/admin";
import { formatJpy } from "@/lib/utils";
import { CustomerActions } from "@/components/admin/customer-actions";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCustomerAdmin(id);
  if (!data) notFound();
  const { customer, orders, lifetimeValue } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">{customer.name}</h1>
        <p className="text-sm text-foreground-muted">{customer.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-foreground-muted">Lifetime value</p><p className="mt-1 font-display text-2xl">{formatJpy(lifetimeValue)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-foreground-muted">Orders</p><p className="mt-1 font-display text-2xl">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-foreground-muted">Points balance</p><p className="mt-1 font-display text-2xl">{customer.pointsBalance}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">Account controls</p>
          <CustomerActions userId={customer.id} role={customer.role} banned={customer.banned} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">Order history</p>
          <ul className="flex flex-col divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="hover:text-primary">{o.orderNumber}</Link>
                <span className="text-foreground-muted">{o.createdAt.toLocaleDateString()}</span>
                <OrderStatusBadge status={o.status} />
                <span className="tabular-nums">{formatJpy(o.totalJpy)}</span>
              </li>
            ))}
            {orders.length === 0 && <p className="py-4 text-foreground-muted">No orders yet.</p>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
