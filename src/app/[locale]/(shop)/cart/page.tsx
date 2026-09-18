import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCartSummaryForRender } from "@/server/cart";
import { CartPageClient } from "@/components/cart/cart-page-client";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const summary = await getCartSummaryForRender();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">{t("yourCart")}</h1>
      <div className="mt-8">
        <CartPageClient initialSummary={summary} />
      </div>
    </div>
  );
}
