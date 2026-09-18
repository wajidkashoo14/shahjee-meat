import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const shippingZones = sqliteTable("shipping_zones", {
  id: text("id").primaryKey(),
  prefecture: text("prefecture").notNull().unique(),
  baseFeeJpy: integer("base_fee_jpy").notNull().default(1200),
  surchargeJpy: integer("surcharge_jpy").notNull().default(0), // Hokkaido/Okinawa surcharge
});

/** Single-row-ish key/value settings table for store-wide configuration. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now','subsec')*1000)`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorName: text("actor_name").notNull().default("system"),
  action: text("action").notNull(), // "product.create" | "order.refund" | ...
  targetType: text("target_type").notNull().default(""),
  targetId: text("target_id").notNull().default(""),
  detail: text("detail").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now','subsec')*1000)`),
});
