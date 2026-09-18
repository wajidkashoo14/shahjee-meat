import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants, productImages, productCollections, collections } from "@/db/schema";

export type SortOption =
  | "featured"
  | "best-selling"
  | "az"
  | "za"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "oldest";

export type CatalogFilters = {
  origin?: string[];
  feed?: string[];
  grade?: string[];
  cut?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
};

/**
 * Collections are "materialized": product_collections rows are computed
 * once (at seed time, or via syncRuleCollectionsForProduct on admin
 * create/update) rather than evaluated live on every request. This keeps
 * collection reads a single join, regardless of whether the collection is
 * "manual" or tag-"rule"-based. See DECISIONS.md.
 */
export async function syncRuleCollectionsForProduct(productId: string) {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return;

  const allCollections = await db.query.collections.findMany();
  const tagSet = new Set([...product.tagsCsv.split(",").filter(Boolean), product.isNewArrival ? "new-arrival" : ""]);

  const categoryCollection = allCollections.find((c) => c.kind === "manual" && c.slug === product.category);
  const ruleMatches = allCollections.filter((c) => c.kind === "rule" && c.ruleTag && tagSet.has(c.ruleTag));
  const desired = new Set([categoryCollection?.id, ...ruleMatches.map((c) => c.id)].filter(Boolean) as string[]);

  const existing = await db.query.productCollections.findMany({ where: eq(productCollections.productId, productId) });
  for (const row of existing) {
    if (!desired.has(row.collectionId)) {
      await db.delete(productCollections).where(eq(productCollections.id, row.id));
    }
  }
  const existingIds = new Set(existing.map((r) => r.collectionId));
  for (const collectionId of desired) {
    if (!existingIds.has(collectionId)) {
      const { uuidv7 } = await import("@/lib/id");
      await db.insert(productCollections).values({ id: uuidv7(), productId, collectionId });
    }
  }
}

export async function getCollectionBySlug(slug: string) {
  return db.query.collections.findFirst({ where: eq(collections.slug, slug) });
}

export async function listAllCollections() {
  return db.query.collections.findMany({ orderBy: (c, { asc }) => [asc(c.sortOrder)] });
}

const PER_PAGE = 12;

export async function listCollectionProducts(
  collectionId: string,
  opts: { sort?: SortOption; filters?: CatalogFilters; page?: number } = {},
) {
  const { sort = "featured", filters = {}, page = 1 } = opts;

  const conditions = [eq(productCollections.collectionId, collectionId), eq(products.status, "published")];
  if (filters.origin?.length) conditions.push(inArray(products.origin, filters.origin));
  if (filters.feed?.length) conditions.push(inArray(products.feed, filters.feed));
  if (filters.grade?.length) conditions.push(inArray(products.grade, filters.grade));
  if (filters.cut?.length) conditions.push(inArray(products.cut, filters.cut));

  const rows = await db
    .select({ product: products })
    .from(productCollections)
    .innerJoin(products, eq(productCollections.productId, products.id))
    .where(and(...conditions))
    .groupBy(products.id);

  const productIds = rows.map((r) => r.product.id);
  if (productIds.length === 0) return { items: [], total: 0, page, perPage: PER_PAGE, filterFacets: emptyFacets() };

  const variants = await db.query.productVariants.findMany({ where: inArray(productVariants.productId, productIds) });
  const images = await db.query.productImages.findMany({ where: inArray(productImages.productId, productIds) });

  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants) variantsByProduct.set(v.productId, [...(variantsByProduct.get(v.productId) ?? []), v]);
  const imagesByProduct = new Map<string, typeof images>();
  for (const im of images) imagesByProduct.set(im.productId, [...(imagesByProduct.get(im.productId) ?? []), im]);

  let items = rows.map((r) => {
    const vs = (variantsByProduct.get(r.product.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const ims = (imagesByProduct.get(r.product.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const minPrice = vs.length ? Math.min(...vs.map((v) => v.priceJpy)) : 0;
    const maxCompareAt = vs.reduce((m, v) => (v.compareAtPriceJpy ? Math.max(m, v.compareAtPriceJpy) : m), 0);
    const totalStock = vs.reduce((s, v) => s + v.stock, 0);
    return {
      product: r.product,
      variants: vs,
      images: ims,
      minPrice,
      hasRange: new Set(vs.map((v) => v.priceJpy)).size > 1,
      onSale: vs.some((v) => v.compareAtPriceJpy && v.compareAtPriceJpy > v.priceJpy),
      compareAtPrice: maxCompareAt || undefined,
      soldOut: totalStock === 0,
      totalStock,
    };
  });

  const facets = computeFacets(items.map((i) => i.product));

  if (filters.minPrice != null) items = items.filter((i) => i.minPrice >= filters.minPrice!);
  if (filters.maxPrice != null) items = items.filter((i) => i.minPrice <= filters.maxPrice!);
  if (filters.inStockOnly) items = items.filter((i) => !i.soldOut);

  items.sort((a, b) => {
    switch (sort) {
      case "best-selling":
        return b.product.salesCount - a.product.salesCount;
      case "az":
        return a.product.nameEn.localeCompare(b.product.nameEn);
      case "za":
        return b.product.nameEn.localeCompare(a.product.nameEn);
      case "price-asc":
        return a.minPrice - b.minPrice;
      case "price-desc":
        return b.minPrice - a.minPrice;
      case "newest":
        return b.product.createdAt.getTime() - a.product.createdAt.getTime();
      case "oldest":
        return a.product.createdAt.getTime() - b.product.createdAt.getTime();
      default:
        return b.product.salesCount - a.product.salesCount;
    }
  });

  const total = items.length;
  const start = (page - 1) * PER_PAGE;
  const pageItems = items.slice(0, start + PER_PAGE); // "load more" style — always from the top

  return { items: pageItems, total, page, perPage: PER_PAGE, filterFacets: facets };
}

function emptyFacets() {
  return { origins: [], feeds: [], grades: [], cuts: [] };
}

function computeFacets(prods: (typeof products.$inferSelect)[]) {
  const uniq = (arr: (string | null | undefined)[]) => [...new Set(arr.filter(Boolean) as string[])].sort();
  return {
    origins: uniq(prods.map((p) => p.origin)),
    feeds: uniq(prods.map((p) => p.feed)),
    grades: uniq(prods.map((p) => p.grade)),
    cuts: uniq(prods.map((p) => p.cut)),
  };
}

export function toCardData(product: {
  id: string;
  variants: Array<{ id: string; priceJpy: number; compareAtPriceJpy: number | null; weightGrams: number; stock: number }>;
  images: Array<{ url: string; alt: string }>;
} & Record<string, unknown>) {
  const vs = product.variants;
  const minPrice = vs.length ? Math.min(...vs.map((v) => v.priceJpy)) : 0;
  const maxCompareAt = vs.reduce((m, v) => (v.compareAtPriceJpy ? Math.max(m, v.compareAtPriceJpy) : m), 0);
  const totalStock = vs.reduce((s, v) => s + v.stock, 0);
  return {
    product: product as never,
    variants: vs,
    images: product.images,
    minPrice,
    hasRange: new Set(vs.map((v) => v.priceJpy)).size > 1,
    onSale: vs.some((v) => v.compareAtPriceJpy && v.compareAtPriceJpy > v.priceJpy),
    compareAtPrice: maxCompareAt || undefined,
    soldOut: totalStock === 0,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      variants: { orderBy: (v, { asc }) => [asc(v.sortOrder)] },
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
  return product ?? null;
}

export async function getRelatedProducts(productId: string, category: string, limit = 4) {
  const rows = await db.query.products.findMany({
    where: and(eq(products.category, category), eq(products.status, "published"), sql`${products.id} != ${productId}`),
    limit,
    with: { variants: { limit: 1, orderBy: (v, { asc }) => [asc(v.sortOrder)] }, images: { limit: 1, orderBy: (i, { asc }) => [asc(i.sortOrder)] } },
  });
  return rows;
}

export async function getAdjacentProducts(category: string, createdAt: Date) {
  const next = await db.query.products.findFirst({
    where: and(eq(products.category, category), sql`${products.createdAt} < ${createdAt.getTime()}`),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  const prev = await db.query.products.findFirst({
    where: and(eq(products.category, category), sql`${products.createdAt} > ${createdAt.getTime()}`),
    orderBy: (p, { asc }) => [asc(p.createdAt)],
  });
  return { next, prev };
}
