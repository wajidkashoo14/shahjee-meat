/**
 * Replaces collection, product and recipe images on an EXISTING database with
 * the curated photos from ./photos.ts. Does not touch any other data.
 *
 * Run with: npm run db:images
 */
import { eq } from "drizzle-orm";
import { db, pool, schema } from "@/db";
import { collectionPhoto, productPhoto, recipePhoto } from "./photos";

async function main() {
  const collections = await db.select().from(schema.collections);
  for (const c of collections) {
    await db.update(schema.collections).set({ heroImage: collectionPhoto(c.slug) }).where(eq(schema.collections.id, c.id));
  }

  const products = await db.select().from(schema.products);
  const images = await db.select().from(schema.productImages);
  const productById = new Map(products.map((p) => [p.id, p]));
  for (const im of images) {
    const p = productById.get(im.productId);
    if (!p) continue;
    await db
      .update(schema.productImages)
      .set({ url: productPhoto(p.category, p.slug, im.sortOrder) })
      .where(eq(schema.productImages.id, im.id));
  }

  const recipes = await db.select().from(schema.recipes);
  for (const r of recipes) {
    await db.update(schema.recipes).set({ heroImage: recipePhoto(r.category, r.slug) }).where(eq(schema.recipes.id, r.id));
  }

  console.log(`Updated ${collections.length} collections, ${images.length} product images, ${recipes.length} recipes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
