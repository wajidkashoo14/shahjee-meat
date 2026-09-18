import { setRequestLocale, getTranslations } from "next-intl/server";
import { searchProducts, searchRecipes } from "@/server/search";
import { toCardData } from "@/server/catalog";
import { ProductRow } from "@/components/shop/product-row";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q = "" } = await searchParams;
  const t = await getTranslations("search");

  const [products, recipes] = await Promise.all([searchProducts(q, 24), searchRecipes(q, 6)]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">
        {q ? t("resultsFor", { query: q }) : t("title")}
      </h1>

      {q && products.length === 0 && recipes.length === 0 && <p className="mt-6 text-foreground-muted">{t("noResults")}</p>}

      {products.length > 0 && (
        <div className="mt-8">
          <ProductRow title={t("products")} items={products.map((p) => toCardData(p))} />
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl">{t("recipes")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {recipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image src={r.heroImage} alt={r.titleEn} fill sizes="33vw" className="object-cover" />
                </div>
                <p className="mt-2 text-sm font-medium group-hover:text-primary">{locale === "ja" ? r.titleJa : r.titleEn}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
