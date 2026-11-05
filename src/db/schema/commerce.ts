import { pgTable, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { productVariants, products } from "./catalog";

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    fullName: text("full_name").notNull(),
    fullNameKana: text("full_name_kana").notNull().default(""),
    phone: text("phone").notNull(),
    postalCode: text("postal_code").notNull(),
    prefecture: text("prefecture").notNull(),
    city: text("city").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2").notNull().default(""),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  guestToken: text("guest_token").unique(),
  promoCode: text("promo_code"),
  giftNote: text("gift_note").notNull().default(""),
  deliveryDate: text("delivery_date"), // ISO date string, chosen at cart stage
  deliverySlot: text("delivery_slot"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cart_items_cart_idx").on(t.cartId)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: text("status").notNull().default("paid"), // paid | packing | shipped | delivered | cancelled | refunded
    subtotalJpy: integer("subtotal_jpy").notNull(),
    shippingJpy: integer("shipping_jpy").notNull(),
    discountJpy: integer("discount_jpy").notNull().default(0),
    taxJpy: integer("tax_jpy").notNull(), // informational (8%) — prices are tax-inclusive
    totalJpy: integer("total_jpy").notNull(),
    pointsEarned: integer("points_earned").notNull().default(0),
    pointsRedeemed: integer("points_redeemed").notNull().default(0),
    promoCode: text("promo_code"),
    shippingName: text("shipping_name").notNull(),
    shippingNameKana: text("shipping_name_kana").notNull().default(""),
    shippingPhone: text("shipping_phone").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingPrefecture: text("shipping_prefecture").notNull(),
    shippingCity: text("shipping_city").notNull(),
    shippingAddressLine1: text("shipping_address_line1").notNull(),
    shippingAddressLine2: text("shipping_address_line2").notNull().default(""),
    deliveryDate: text("delivery_date").notNull(),
    deliverySlot: text("delivery_slot").notNull(),
    giftNote: text("gift_note").notNull().default(""),
    paymentMethod: text("payment_method").notNull().default("test"), // stripe | konbini | test
    paymentIntentId: text("payment_intent_id"),
    carrier: text("carrier"), // yamato | sagawa
    trackingNumber: text("tracking_number"),
    cancelCutoffAt: timestamp("cancel_cutoff_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Snapshot fields — never change after the order is placed.
    nameEn: text("name_en").notNull(),
    nameJa: text("name_ja").notNull(),
    variantLabelEn: text("variant_label_en").notNull(),
    variantLabelJa: text("variant_label_ja").notNull(),
    image: text("image").notNull().default(""),
    unitPriceJpy: integer("unit_price_jpy").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalJpy: integer("line_total_jpy").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const refunds = pgTable("refunds", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amountJpy: integer("amount_jpy").notNull(),
  reason: text("reason").notNull().default(""),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const discounts = pgTable("discounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  kind: text("kind").notNull(), // percent | fixed | free-shipping
  value: integer("value").notNull().default(0), // percent (0-100) or fixed yen
  minSpendJpy: integer("min_spend_jpy").notNull().default(0),
  usageLimit: integer("usage_limit"),
  usageLimitPerCustomer: integer("usage_limit_per_customer"),
  timesUsed: integer("times_used").notNull().default(0),
  collectionIdsCsv: text("collection_ids_csv").notNull().default(""),
  startsAt: timestamp("starts_at", { mode: "date", withTimezone: true }),
  endsAt: timestamp("ends_at", { mode: "date", withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const discountRedemptions = pgTable("discount_redemptions", {
  id: text("id").primaryKey(),
  discountId: text("discount_id")
    .notNull()
    .references(() => discounts.id, { onDelete: "cascade" }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Meat Box"),
  frequencyWeeks: integer("frequency_weeks").notNull().default(2), // 2 or 4
  status: text("status").notNull().default("active"), // active | paused | cancelled
  nextDeliveryDate: text("next_delivery_date").notNull(),
  deliverySlot: text("delivery_slot").notNull().default("morning"),
  totalJpy: integer("total_jpy").notNull().default(0),
  addressId: text("address_id").references(() => addresses.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionItems = pgTable("subscription_items", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  variantId: text("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
});

export const loyaltyLedger = pgTable("loyalty_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  points: integer("points").notNull(), // positive = earned, negative = redeemed
  reason: text("reason").notNull(), // "order" | "redeem" | "referral" | "adjustment"
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  refunds: many(refunds),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, { fields: [refunds.orderId], references: [orders.id] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));
