import { CheckCircle2 } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { order } = await searchParams;
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <CheckCircle2 className="size-16 text-success" />
      <h1 className="mt-6 font-display text-4xl">{t("orderConfirmed")}</h1>
      {order && (
        <p className="mt-3 text-foreground-muted">
          {t("orderNumber")}: <span className="font-medium text-foreground">{order}</span>
        </p>
      )}
      <p className="mt-2 text-foreground-muted">{t("orderConfirmedDesc")}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/account/orders">{t("viewOrder")}</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/collections">{t("continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
