import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getMyStockAlerts } from "@/server/account";
import { AlertRemoveButton } from "@/components/account/alert-remove-button";

export default async function AlertsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.alerts");
  const locale = await getLocale();
  const alerts = await getMyStockAlerts(session!.user.id);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
              {alert.product?.images[0] && (
                <Image src={alert.product.images[0].url} alt={alert.product.nameEn} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              {alert.product && (
                <Link href={`/products/${alert.product.slug}`} className="text-sm font-medium hover:text-primary">
                  {locale === "ja" ? alert.product.nameJa : alert.product.nameEn}
                </Link>
              )}
              <p className="text-xs text-foreground-muted">
                {alert.variant ? (locale === "ja" ? alert.variant.labelJa : alert.variant.labelEn) : ""} — {t("waitingFor")}
              </p>
            </div>
            <AlertRemoveButton alertId={alert.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
