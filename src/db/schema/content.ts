import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { products } from "./catalog";

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull(),
  titleJa: text("title_ja").notNull(),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptJa: text("excerpt_ja").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""), // markdown-ish rich text
  bodyJa: text("body_ja").notNull().default(""),
  heroImage: text("hero_image").notNull(),
  category: text("category").notNull().default("grill"), // grill | oven | stew | raw | bbq
  cookTimeMinutes: integer("cook_time_minutes").notNull().default(30),
  difficulty: text("difficulty").notNull().default("easy"), // easy | medium | hard
  servings: integer("servings").notNull().default(2),
  status: text("status").notNull().default("published"), // draft | published
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now','subsec')*1000)`),
});

export const recipeProducts = sqliteTable(
  "recipe_products",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantityLabel: text("quantity_label").notNull().default(""),
  },
  (t) => [index("recipe_products_recipe_idx").on(t.recipeId)],
);

export const recipesRelations = relations(recipes, ({ many }) => ({
  products: many(recipeProducts),
}));

export const recipeProductsRelations = relations(recipeProducts, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeProducts.recipeId], references: [recipes.id] }),
  product: one(products, { fields: [recipeProducts.productId], references: [products.id] }),
}));
