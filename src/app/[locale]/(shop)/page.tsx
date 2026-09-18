import Image from "next/image";
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
          src="https://picsum.photos/seed/wc-hero/1800/1200"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-charcoal/10" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brass">{t("heroKicker")}</p>
          <h1 className="max-w-2xl font-display text-5xl leading-[1.05] text-bone sm:text-7xl">{t("heroTitle")}</h1>
          <p className="mt-5 max-w-lg text-bone/80">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/collections/beef">{t("heroCtaShop")}</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
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
        <h2 className="font-display text-3xl">{t("shopByCategory")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {PRIMARY_CATEGORIES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <div className={`relative ${i === 0 ? "aspect-square sm:aspect-[4/3]" : "aspect-square"}`}>
                <Image
                  src={`https://picsum.photos/seed/wc-cat-${c.slug}/700/700`}
                  alt={c.labelEn}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
              </div>
              <span className="absolute bottom-3 left-4 font-display text-lg text-bone sm:text-xl">
                {locale === "ja" ? c.labelJa : c.labelEn}
              </span>
            </Link>
          ))}
        </div>

        {/* New arrivals */}
        <div className="mt-20">
          <ProductRow title={t("newArrivals")} items={newArrivals} />
        </div>

        {/* Cut map */}
        <section className="mt-20">
          <CutMap />
        </section>

        {/* Best sellers */}
        <div className="mt-20">
          <ProductRow title={t("bestSellers")} items={bestSellers} />
        </div>

        {/* Recipes */}
        {recipes.length > 0 && (
          <section className="mt-20">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-3xl">{t("recipeHighlights")}</h2>
              <Link href="/recipes" className="text-sm text-primary hover:underline">
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
                  <h3 className="mt-3 font-display text-lg group-hover:text-primary">
                    {locale === "ja" ? r.titleJa : r.titleEn}
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">{locale === "ja" ? r.excerptJa : r.excerptEn}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="mt-24 flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-10 text-center">
          <h2 className="font-display text-3xl">{t("newsletterTitle")}</h2>
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
      <span className="text-primary">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
