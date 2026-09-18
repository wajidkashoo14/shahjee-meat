import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull(),
  titleJa: text("title_ja").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionJa: text("description_ja").notNull().default(""),
  heroImage: text("hero_image").notNull(),
  /** "manual" collections are populated via product_collections; "rule" collections are computed from `ruleTag` */
  kind: text("kind").notNull().default("manual"), // manual | rule
  ruleTag: text("rule_tag"), // e.g. "grass-fed", "steaks", "organic"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now','subsec')*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now','subsec')*1000)`),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    nameEn: text("name_en").notNull(),
    nameJa: text("name_ja").notNull(),
    subtitleEn: text("subtitle_en").notNull().default(""),
    subtitleJa: text("subtitle_ja").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionJa: text("description_ja").notNull().default(""),
    cookingGuideEn: text("cooking_guide_en").notNull().default(""),
    cookingGuideJa: text("cooking_guide_ja").notNull().default(""),
    origin: text("origin").notNull().default(""),
    feed: text("feed"), // grass-fed | grain-fed | organic | null
    grade: text("grade"),
    cut: text("cut"),
    category: text("category").notNull(), // beef | other-meats | charcuterie | spices | frozen
    tagsCsv: text("tags_csv").notNull().default(""), // comma separated tags for filtering
    status: text("status").notNull().default("published"), // draft | published | scheduled
    publishAt: integer("publish_at", { mode: "timestamp_ms" }),
    isNewArrival: integer("is_new_arrival", { mode: "boolean" }).notNull().default(false),
    salesCount: integer("sales_count").notNull().default(0),
    ratingAvg: real("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now','subsec')*1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now','subsec')*1000)`),
  },
  (t) => [index("products_category_idx").on(t.category), index("products_status_idx").on(t.status)],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/** Weight-range variants, e.g. "0.6kg~0.8kg", each with its own price/stock. */
export const productVariants = sqliteTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    labelEn: text("label_en").notNull(), // "0.6Kg~0.8Kg"
    labelJa: text("label_ja").notNull(),
    weightGrams: integer("weight_grams").notNull(), // representative weight, for price-per-100g
    priceJpy: integer("price_jpy").notNull(), // tax-inclusive, integer yen
    compareAtPriceJpy: integer("compare_at_price_jpy"), // set when on sale
    stock: integer("stock").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now','subsec')*1000)`),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelJa: text("label_ja").notNull(),
  kind: text("kind").notNull().default("general"), // general | origin | cut | feed | grade
});

export const productCollections = sqliteTable(
  "product_collections",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("product_collections_unique").on(t.productId, t.collectionId)],
);

export const inventoryMovements = sqliteTable(
  "inventory_movements",
  {
    id: text("id").primaryKey(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    change: integer("change").notNull(), // positive = restock, negative = sale/adjustment
    reason: text("reason").notNull(), // "order" | "restock" | "manual-adjustment" | "return"
    note: text("note").notNull().default(""),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('now','subsec')*1000)`),
  },
  (t) => [index("inventory_movements_variant_idx").on(t.variantId)],
);

export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  variants: many(productVariants),
  collections: many(productCollections),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  movements: many(inventoryMovements),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, { fields: [productCollections.productId], references: [products.id] }),
  collection: one(collections, { fields: [productCollections.collectionId], references: [collections.id] }),
}));
