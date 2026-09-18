import "server-only";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { products, recipes } from "@/db/schema";

export async function searchProducts(query: string, limit = 8) {
  if (!query.trim()) return [];
  const q = `%${query.trim()}%`;
  const rows = await db.query.products.findMany({
    where: and(
      eq(products.status, "published"),
      or(like(products.nameEn, q), like(products.nameJa, q), like(products.tagsCsv, q), like(products.cut, q)),
    ),
    limit,
    with: { images: { limit: 1, orderBy: (img, { asc }) => [asc(img.sortOrder)] }, variants: true },
  });
  return rows;
}

export async function searchRecipes(query: string, limit = 4) {
  if (!query.trim()) return [];
  const q = `%${query.trim()}%`;
  return db.query.recipes.findMany({
    where: and(eq(recipes.status, "published"), or(like(recipes.titleEn, q), like(recipes.titleJa, q))),
    limit,
  });
}
