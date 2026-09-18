import "server-only";
import { and, desc, eq, gte, sql, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  orders, products, productVariants, discounts, reviews, questions,
  inquiries, recipes, user as userTable, auditLogs, settings as settingsTable,
} from "@/db/schema";

export async function getKpis(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const recentOrders = await db.query.orders.findMany({ where: gte(orders.createdAt, since) });
  const revenue = recentOrders.reduce((s, o) => s + o.totalJpy, 0);
  const orderCount = recentOrders.length;
  const aov = orderCount ? Math.round(revenue / orderCount) : 0;

  // Simple day-by-day revenue series for the chart.
  const byDay = new Map<string, number>();
  for (const o of recentOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + o.totalJpy);
  }
  const series = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total }));

  return { revenue, orderCount, aov, series };
}

export async function getTopProducts(limit = 5) {
  return db.query.products.findMany({ orderBy: desc(products.salesCount), limit });
}

export async function getLowStockVariants(threshold = 5) {
  const rows = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(lte(productVariants.stock, threshold))
    .orderBy(productVariants.stock)
    .limit(10);
  return rows;
}

export async function getUpcomingDeliveries(days = 7) {
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const rows = await db.query.orders.findMany({
    where: and(gte(orders.deliveryDate, today), lte(orders.deliveryDate, until), sql`${orders.status} != 'cancelled'`),
  });
  const byDate = new Map<string, number>();
  for (const o of rows) byDate.set(o.deliveryDate, (byDate.get(o.deliveryDate) ?? 0) + 1);
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export async function getPendingCounts() {
  const [pendingReviews, pendingQuestions, openInquiries] = await Promise.all([
    db.query.reviews.findMany({ where: eq(reviews.status, "pending") }),
    db.query.questions.findMany({ where: eq(questions.status, "pending") }),
    db.query.inquiries.findMany({ where: eq(inquiries.status, "open") }),
  ]);
  return { pendingReviews: pendingReviews.length, pendingQuestions: pendingQuestions.length, openInquiries: openInquiries.length };
}

export async function listProductsAdmin() {
  const prods = await db.query.products.findMany({
    orderBy: desc(products.createdAt),
    with: { variants: true, images: { limit: 1 } },
  });
  return prods;
}

export async function getProductAdmin(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: { orderBy: (v, { asc }) => [asc(v.sortOrder)] }, images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] } },
  });
}

export async function listCollectionsAdmin() {
  return db.query.collections.findMany({ orderBy: (c, { asc }) => [asc(c.sortOrder)] });
}

export async function listOrdersAdmin(status?: string) {
  return db.query.orders.findMany({
    where: status && status !== "all" ? eq(orders.status, status) : undefined,
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
}

export async function getOrderAdmin(id: string) {
  return db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true, refunds: true } });
}

export async function listCustomersAdmin() {
  return db.query.user.findMany({ orderBy: desc(userTable.createdAt) });
}

export async function getCustomerAdmin(id: string) {
  const customer = await db.query.user.findFirst({ where: eq(userTable.id, id) });
  if (!customer) return null;
  const customerOrders = await db.query.orders.findMany({ where: eq(orders.userId, id), orderBy: desc(orders.createdAt) });
  const lifetimeValue = customerOrders.reduce((s, o) => s + o.totalJpy, 0);
  return { customer, orders: customerOrders, lifetimeValue };
}

export async function listDiscountsAdmin() {
  return db.query.discounts.findMany({ orderBy: desc(discounts.createdAt) });
}

export async function listReviewsAdmin() {
  const rows = await db.query.reviews.findMany({ orderBy: desc(reviews.createdAt) });
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const prods = productIds.length ? await db.query.products.findMany({ where: (p, { inArray }) => inArray(p.id, productIds) }) : [];
  return rows.map((r) => ({ ...r, product: prods.find((p) => p.id === r.productId) }));
}

export async function listQuestionsAdmin() {
  const rows = await db.query.questions.findMany({ orderBy: desc(questions.createdAt), with: { answers: true } });
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const prods = productIds.length ? await db.query.products.findMany({ where: (p, { inArray }) => inArray(p.id, productIds) }) : [];
  return rows.map((r) => ({ ...r, product: prods.find((p) => p.id === r.productId) }));
}

export async function listRecipesAdmin() {
  return db.query.recipes.findMany({ orderBy: desc(recipes.createdAt) });
}

export async function getRecipeAdmin(id: string) {
  return db.query.recipes.findFirst({ where: eq(recipes.id, id), with: { products: { with: { product: true } } } });
}

export async function listInquiriesAdmin() {
  return db.query.inquiries.findMany({ orderBy: desc(inquiries.createdAt) });
}

export async function listAuditLogAdmin(limit = 100) {
  return db.query.auditLogs.findMany({ orderBy: desc(auditLogs.createdAt), limit });
}

export async function listShippingZonesAdmin() {
  return db.query.shippingZones.findMany({ orderBy: (z, { asc }) => [asc(z.prefecture)] });
}

export async function getSetting(key: string) {
  const row = await db.query.settings.findFirst({ where: eq(settingsTable.key, key) });
  return row ? JSON.parse(row.value) : null;
}
