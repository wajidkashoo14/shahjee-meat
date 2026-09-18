import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { listOrdersAdmin } from "@/server/admin";
import { formatJpy } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const orders = await listOrdersAdmin(status);
  const STATUSES = ["all", "paid", "packing", "shipped", "delivered", "cancelled", "refunded"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`}>
            <Button variant={status === s ? "primary" : "outline"} size="sm" className="capitalize">
              {s}
            </Button>
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.orderNumber}</TableCell>
              <TableCell className="text-foreground-muted">{o.email}</TableCell>
              <TableCell className="text-foreground-muted">{o.createdAt.toLocaleDateString()}</TableCell>
              <TableCell className="tabular-nums">{formatJpy(o.totalJpy)}</TableCell>
              <TableCell><OrderStatusBadge status={o.status} /></TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/orders/${o.id}`}>Manage</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-foreground-muted">No orders match this filter.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
