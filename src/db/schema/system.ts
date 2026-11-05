import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const shippingZones = pgTable("shipping_zones", {
  id: text("id").primaryKey(),
  prefecture: text("prefecture").notNull().unique(),
  baseFeeJpy: integer("base_fee_jpy").notNull().default(1200),
  surchargeJpy: integer("surcharge_jpy").notNull().default(0), // Hokkaido/Okinawa surcharge
});

/** Single-row-ish key/value settings table for store-wide configuration. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorName: text("actor_name").notNull().default("system"),
  action: text("action").notNull(), // "product.create" | "order.refund" | ...
  targetType: text("target_type").notNull().default(""),
  targetId: text("target_id").notNull().default(""),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
