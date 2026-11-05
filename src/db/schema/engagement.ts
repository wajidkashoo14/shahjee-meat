import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { products } from "./catalog";

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(), // 1-5
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),
    helpfulCount: integer("helpful_count").notNull().default(0),
    status: text("status").notNull().default("approved"), // pending | approved | hidden
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const reviewImages = pgTable("review_images", {
  id: text("id").primaryKey(),
  reviewId: text("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
});

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"), // pending | answered | hidden
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("questions_product_idx").on(t.productId)],
);

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull().default("Whole Cuts Staff"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("wishlists_unique").on(t.userId, t.productId)],
);

export const stockAlerts = pgTable(
  "stock_alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    variantId: text("variant_id").notNull(),
    productId: text("product_id").notNull(),
    notified: boolean("notified").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stock_alerts_variant_idx").on(t.variantId)],
);

export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull().default("general"), // general | wholesale | product
  productId: text("product_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open | replied | closed
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ many }) => ({
  images: many(reviewImages),
}));

export const reviewImagesRelations = relations(reviewImages, ({ one }) => ({
  review: one(reviews, { fields: [reviewImages.reviewId], references: [reviews.id] }),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));
