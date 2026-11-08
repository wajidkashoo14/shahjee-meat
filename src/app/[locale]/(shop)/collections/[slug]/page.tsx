import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Filter } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCollectionBySlug, listCollectionProducts, type SortOption } from "@/server/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { SortSelect } from "@/components/shop/sort-select";
import { FilterPanel } from "@/components/shop/filter-panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

type SearchParams = Record<string, string | string[] | undefined>;

function arr(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v : v.split(",");
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const page = sp.page ? Number(sp.page) : 1;
  const sort = (sp.sort as SortOption) || "featured";
  const { items, total, filterFacets } = await listCollectionProducts(collection.id, {
    sort,
    page,
    filters: {
      origin: arr(sp.origin),
      feed: arr(sp.feed),
      grade: arr(sp.grade),
      cut: arr(sp.cut),
      minPrice: sp.min ? Number(sp.min) : undefined,
      maxPrice: sp.max ? Number(sp.max) : undefined,
      inStockOnly: sp.inStock === "true",
    },
  });

  const t = await getTranslations("shop");
  const title = locale === "ja" ? collection.titleJa : collection.titleEn;
  const desc = locale === "ja" ? collection.descriptionJa : collection.descriptionEn;

  const nextPageQuery = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (v == null ? [] : [[k, Array.isArray(v) ? v.join(",") : v]])),
  );
  nextPageQuery.set("page", String(page + 1));

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden sm:h-64">
        <Image src={collection.heroImage} alt={title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <nav className="mb-4 text-xs text-foreground-muted">
          <Link href="/">Home</Link> <span className="mx-1">/</span> <Link href="/collections">Collections</Link>{" "}
          <span className="mx-1">/</span> <span className="text-foreground">{title}</span>
        </nav>
        <h1 className="font-display text-4xl">{title}</h1>
        {desc && <p className="mt-3 max-w-2xl text-foreground-muted">{desc}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <p className="text-sm text-foreground-muted">{t("resultsCount", { count: total })}</p>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="size-4" /> {t("filters")}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh]">
                <SheetHeader>
                  <SheetTitle>{t("filters")}</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto px-6 pb-6">
                  <FilterPanel facets={filterFacets} />
                </div>
              </SheetContent>
            </Sheet>
            <SortSelect />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel facets={filterFacets} />
            </div>
          </aside>

          <div>
            {items.length === 0 ? (
              <p className="py-24 text-center text-foreground-muted">{t("noProducts")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3">
                {items.map((item) => (
                  <ProductCard key={item.product.id} data={item} />
                ))}
              </div>
            )}

            {items.length < total && (
              <div className="mt-12 flex justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link href={`/collections/${slug}?${nextPageQuery.toString()}`}>{t("loadMore")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
