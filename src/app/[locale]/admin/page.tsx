import { Link } from "@/i18n/navigation";
import { AlertTriangle, TrendingUp, ShoppingBag, Receipt, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getKpis, getTopProducts, getLowStockVariants, getUpcomingDeliveries, getPendingCounts } from "@/server/admin";
import { formatJpy } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";

export default async function AdminOverviewPage() {
  const [kpis, topProducts, lowStock, upcoming, pending] = await Promise.all([
    getKpis(30),
    getTopProducts(5),
    getLowStockVariants(5),
    getUpcomingDeliveries(7),
    getPendingCounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={<TrendingUp className="size-4" />} label="Revenue (30d)" value={formatJpy(kpis.revenue)} />
        <Kpi icon={<ShoppingBag className="size-4" />} label="Orders (30d)" value={kpis.orderCount.toLocaleString()} />
        <Kpi icon={<Receipt className="size-4" />} label="Avg. order value" value={formatJpy(kpis.aov)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-2 font-semibold">Revenue, last 30 days</p>
          {kpis.series.length > 0 ? <RevenueChart series={kpis.series} /> : <p className="py-12 text-center text-sm text-foreground-muted">No orders yet.</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 font-semibold">Top products</p>
            <ul className="flex flex-col gap-2 text-sm">
              {topProducts.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{p.nameEn}</span>
                  <span className="shrink-0 whitespace-nowrap tabular-nums text-foreground-muted">{p.salesCount} sold</span>
                </li>
              ))}
              {topProducts.length === 0 && <p className="text-foreground-muted">No data yet.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Low stock
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {lowStock.map(({ variant, product }) => (
                <li key={variant.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {product.nameEn} — {variant.labelEn}
                  </span>
                  <span className={`shrink-0 whitespace-nowrap font-semibold tabular-nums ${variant.stock === 0 ? "text-danger" : "text-warning"}`}>{variant.stock} left</span>
                </li>
              ))}
              {lowStock.length === 0 && <p className="text-foreground-muted">Everything is well stocked.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <Truck className="size-4 text-foreground" /> Upcoming deliveries
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {upcoming.map((u) => (
                <li key={u.date} className="flex justify-between gap-3">
                  <span>{u.date}</span>
                  <span className="shrink-0 whitespace-nowrap tabular-nums text-foreground-muted">{u.count} orders</span>
                </li>
              ))}
              {upcoming.length === 0 && <p className="text-foreground-muted">Nothing scheduled this week.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/reviews">
          <Card className="transition-colors hover:border-foreground/40">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums">{pending.pendingReviews}</p>
              <p className="text-sm text-foreground-muted">Reviews to moderate</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reviews">
          <Card className="transition-colors hover:border-foreground/40">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums">{pending.pendingQuestions}</p>
              <p className="text-sm text-foreground-muted">Questions awaiting an answer</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/inquiries">
          <Card className="transition-colors hover:border-foreground/40">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold tracking-tight tabular-nums">{pending.openInquiries}</p>
              <p className="text-sm text-foreground-muted">Open inquiries</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="flex items-center gap-2 text-sm text-foreground-muted">
          {icon} {label}
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
