import Image from "next/image";
import { collectionPhoto, heroPhoto } from "@/db/photos";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Snowflake, Truck, MapPinned, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PRIMARY_CATEGORIES } from "@/lib/nav";
import { ProductRow } from "@/components/shop/product-row";
import { CutMap } from "@/components/shop/cut-map";
import { NewsletterForm } from "@/components/shop/newsletter-form";
import { getNewArrivals, getBestSellers } from "@/server/home";
import { db } from "@/db";

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [newArrivals, bestSellers, recipes] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    db.query.recipes.findMany({ limit: 3, orderBy: (r, { desc }) => [desc(r.createdAt)] }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-end overflow-hidden">
        <Image
          src={heroPhoto()}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/50 to-scrim/10" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
          <p className="eyebrow mb-4 text-on-scrim/80">{t("heroKicker")}</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[1.02] tracking-[-0.025em] text-on-scrim sm:text-7xl">{t("heroTitle")}</h1>
          <p className="mt-5 max-w-lg text-lg text-on-scrim/85">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/collections/beef">{t("heroCtaShop")}</Link>
            </Button>
            <Button size="lg" variant="inverseOutline" asChild>
              <Link href="/recipes">{t("heroCtaRecipes")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6">
          <Trust icon={<Snowflake className="size-5" />} label={t("trustFrozen")} />
          <Trust icon={<Truck className="size-5" />} label={t("trustDelivery")} />
          <Trust icon={<MapPinned className="size-5" />} label={t("trustOrigin")} />
          <Trust icon={<ShieldCheck className="size-5" />} label={t("trustSecure")} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {/* Category bento */}
        <h2 className="font-display text-3xl sm:text-4xl">{t("shopByCategory")}</h2>
        {/* Feature tile + five tiles: fills a 3×3 grid exactly (sm+); on phones the last tile runs full width. */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {PRIMARY_CATEGORIES.map((c, i) => {
            const feature = i === 0;
            const last = i === PRIMARY_CATEGORIES.length - 1;
            return (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className={`group relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${feature ? "col-span-2 sm:row-span-2" : last ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <div
                  className={`relative ${feature ? "aspect-[4/3] sm:aspect-auto sm:h-full" : last ? "aspect-[2/1] sm:aspect-[4/3]" : "aspect-square sm:aspect-[4/3]"}`}
                >
                  <Image
                    src={collectionPhoto(c.slug)}
                    alt={c.labelEn}
                    fill
                    sizes={feature ? "(min-width: 640px) 66vw, 100vw" : "(min-width: 640px) 33vw, 50vw"}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/10 to-transparent" />
                </div>
                <span
                  className={`absolute bottom-3 left-4 font-display text-on-scrim sm:bottom-4 sm:left-5 ${feature ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}
                >
                  {locale === "ja" ? c.labelJa : c.labelEn}
                </span>
              </Link>
            );
          })}
        </div>

        {/* New arrivals */}
        <div className="mt-20">
          <ProductRow title={t("newArrivals")} items={newArrivals} fullRows />
        </div>

        {/* Cut map */}
        <section className="mt-20">
          <CutMap />
        </section>

        {/* Best sellers */}
        <div className="mt-20">
          <ProductRow title={t("bestSellers")} items={bestSellers} fullRows />
        </div>

        {/* Recipes */}
        {recipes.length > 0 && (
          <section className="mt-20">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-3xl sm:text-4xl">{t("recipeHighlights")}</h2>
              <Link href="/recipes" className="text-sm font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                {t("viewAllRecipes")}
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {recipes.map((r) => (
                <Link key={r.id} href={`/recipes/${r.slug}`} className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image
                      src={r.heroImage}
                      alt={locale === "ja" ? r.titleJa : r.titleEn}
                      fill
                      sizes="33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-display text-lg underline-offset-4 group-hover:underline">
                    {locale === "ja" ? r.titleJa : r.titleEn}
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">{locale === "ja" ? r.excerptJa : r.excerptEn}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="mt-24 flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
          <h2 className="font-display text-3xl sm:text-4xl">{t("newsletterTitle")}</h2>
          <p className="max-w-md text-foreground-muted">{t("newsletterSubtitle")}</p>
          <NewsletterForm />
        </section>
      </div>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-foreground">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
