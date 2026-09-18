import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  orders, wishlists, stockAlerts, addresses, reviews, subscriptions,
  subscriptionItems, loyaltyLedger, referrals, products,
} from "@/db/schema";

export async function getMyOrders(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true, refunds: true } });
  if (!order || order.userId !== userId) return null;
  return order;
}

export async function getMyWishlist(userId: string) {
  const rows = await db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    orderBy: desc(wishlists.createdAt),
  });
  const productIds = rows.map((r) => r.productId);
  if (productIds.length === 0) return [];
  const prods = await db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, productIds),
    with: { variants: true, images: true },
  });
  return rows.map((r) => ({ wishlistId: r.id, product: prods.find((p) => p.id === r.productId) })).filter((r) => r.product);
}

export async function getMyStockAlerts(userId: string) {
  const rows = await db.query.stockAlerts.findMany({ where: eq(stockAlerts.userId, userId), orderBy: desc(stockAlerts.createdAt) });
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const prods = productIds.length
    ? await db.query.products.findMany({ where: (p, { inArray }) => inArray(p.id, productIds), with: { images: true, variants: true } })
    : [];
  return rows.map((r) => ({
    ...r,
    product: prods.find((p) => p.id === r.productId),
    variant: prods.find((p) => p.id === r.productId)?.variants.find((v) => v.id === r.variantId),
  }));
}

export async function getMyAddresses(userId: string) {
  return db.query.addresses.findMany({ where: eq(addresses.userId, userId), orderBy: desc(addresses.isDefault) });
}

export async function getMyReviews(userId: string) {
  const rows = await db.query.reviews.findMany({ where: eq(reviews.userId, userId), orderBy: desc(reviews.createdAt) });
  const productIds = rows.map((r) => r.productId);
  const prods = productIds.length ? await db.query.products.findMany({ where: (p, { inArray }) => inArray(p.id, productIds) }) : [];
  return rows.map((r) => ({ ...r, product: prods.find((p) => p.id === r.productId) }));
}

export async function getMySubscriptions(userId: string) {
  const subs = await db.query.subscriptions.findMany({ where: eq(subscriptions.userId, userId), orderBy: desc(subscriptions.createdAt) });
  const result = [];
  for (const sub of subs) {
    const items = await db.query.subscriptionItems.findMany({ where: eq(subscriptionItems.subscriptionId, sub.id) });
    const variantIds = items.map((i) => i.variantId);
    const variants = variantIds.length
      ? await db.query.productVariants.findMany({ where: (v, { inArray }) => inArray(v.id, variantIds), with: { product: true } })
      : [];
    result.push({
      ...sub,
      items: items.map((i) => ({ ...i, variant: variants.find((v) => v.id === i.variantId) })),
    });
  }
  return result;
}

export async function getMyPointsLedger(userId: string) {
  return db.query.loyaltyLedger.findMany({ where: eq(loyaltyLedger.userId, userId), orderBy: desc(loyaltyLedger.createdAt) });
}

export async function getMyReferral(userId: string) {
  return db.query.referrals.findFirst({ where: eq(referrals.userId, userId) });
}

export async function getRecommendedProducts(limit = 4) {
  const rows = await db.query.products.findMany({
    where: eq(products.status, "published"),
    limit,
    orderBy: desc(products.salesCount),
    with: { variants: true, images: true },
  });
  return rows;
}
