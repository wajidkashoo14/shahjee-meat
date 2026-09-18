import "server-only";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { toCardData } from "@/server/catalog";

async function withVariantsAndImages(prods: (typeof products.$inferSelect)[]) {
  const ids = prods.map((p) => p.id);
  if (ids.length === 0) return [];
  const variants = await db.query.productVariants.findMany({ where: inArray(productVariants.productId, ids) });
  const images = await db.query.productImages.findMany({ where: inArray(productImages.productId, ids) });
  return prods.map((p) => ({
    ...p,
    variants: variants.filter((v) => v.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
    images: images.filter((i) => i.productId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export async function getNewArrivals(limit = 8) {
  const rows = await db.query.products.findMany({
    where: eq(products.isNewArrival, true),
    limit,
    orderBy: desc(products.createdAt),
  });
  return (await withVariantsAndImages(rows)).map(toCardData);
}

export async function getBestSellers(limit = 8) {
  const rows = await db.query.products.findMany({
    where: eq(products.status, "published"),
    limit,
    orderBy: desc(products.salesCount),
  });
  return (await withVariantsAndImages(rows)).map(toCardData);
}
