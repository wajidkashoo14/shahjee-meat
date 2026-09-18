import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CartSheet } from "@/components/cart/cart-sheet";
import { CartProvider } from "@/components/cart/cart-provider";
import { CommandPalette } from "@/components/search/command-palette";
import { getCartSummaryForRender } from "@/server/cart";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const cartSummary = await getCartSummaryForRender();

  return (
    <NextIntlClientProvider locale={locale}>
      <NuqsAdapter>
      <CartProvider initialSummary={cartSummary}>
        <SiteHeader />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <SiteFooter />
        <MobileNav />
        <CartSheet />
        <CommandPalette />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "var(--surface-raised)", color: "var(--foreground)", border: "1px solid var(--border)" },
          }}
        />
      </CartProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  );
}
