import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Clock, ChefHat, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/db";
import { ShopRecipeButton } from "@/components/shop/shop-recipe-button";
import { formatJpy } from "@/lib/utils";

export const revalidate = 60;

export default async function RecipeDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recipes");

  const recipe = await db.query.recipes.findFirst({
    where: (r, { eq }) => eq(r.slug, slug),
    with: { products: { with: { product: { with: { variants: true, images: true } } } } },
  });
  if (!recipe) notFound();

  const title = locale === "ja" ? recipe.titleJa : recipe.titleEn;
  const body = locale === "ja" ? recipe.bodyJa : recipe.bodyEn;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    image: [recipe.heroImage],
    recipeYield: `${recipe.servings}`,
    totalTime: `PT${recipe.cookTimeMinutes}M`,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-xs text-foreground-muted">
        <Link href="/recipes">{t("title")}</Link> <span className="mx-1">/</span> <span className="text-foreground">{title}</span>
      </nav>

      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
        <Image src={recipe.heroImage} alt={title} fill sizes="800px" className="object-cover" priority />
      </div>

      <h1 className="mt-6 font-display text-4xl">{title}</h1>
      <p className="mt-2 text-foreground-muted">{locale === "ja" ? recipe.excerptJa : recipe.excerptEn}</p>

      <div className="mt-4 flex items-center gap-6 text-sm text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> {recipe.cookTimeMinutes} {t("minutes")}
        </span>
        <span className="flex items-center gap-1.5">
          <ChefHat className="size-4" /> {t(`difficulty.${recipe.difficulty}`)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" /> {recipe.servings} {t("servings")}
        </span>
      </div>

      {recipe.products.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <p className="font-display text-lg">{t("whatYoullNeed")}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {recipe.products.map((rp) => {
              const p = rp.product;
              const cheapest = [...p.variants].sort((a, b) => a.priceJpy - b.priceJpy)[0];
              return (
                <li key={rp.id} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                    {p.images[0] && <Image src={p.images[0].url} alt={p.nameEn} fill sizes="48px" className="object-cover" />}
                  </div>
                  <Link href={`/products/${p.slug}`} className="flex-1 text-sm font-medium hover:text-primary">
                    {locale === "ja" ? p.nameJa : p.nameEn}
                  </Link>
                  {cheapest && <span className="text-sm text-foreground-muted tabular-nums">{formatJpy(cheapest.priceJpy)}</span>}
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <ShopRecipeButton recipeId={recipe.id} />
          </div>
        </div>
      )}

      <div className="mt-10 max-w-none whitespace-pre-line leading-relaxed text-foreground-muted">{body}</div>
    </div>
  );
}
