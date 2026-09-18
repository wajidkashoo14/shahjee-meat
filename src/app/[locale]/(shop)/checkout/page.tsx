import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCartSummaryForRender } from "@/server/cart";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isStripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  const summary = await getCartSummaryForRender();
  if (summary.items.length === 0) redirect("/cart");

  const session = await auth.api.getSession({ headers: await headers() });
  const savedAddresses = session?.user
    ? await db.query.addresses.findMany({ where: eq(addresses.userId, session.user.id) })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <div className="mt-8">
        <CheckoutForm
          initialSummary={summary}
          savedAddresses={savedAddresses}
          userEmail={session?.user?.email}
          userName={session?.user?.name}
          stripeEnabled={isStripeConfigured()}
        />
      </div>
    </div>
  );
}
