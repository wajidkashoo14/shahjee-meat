"use server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  products, productVariants, productImages, collections, productCollections,
  inventoryMovements, orders, refunds, discounts, reviews, questions, answers,
  recipes, recipeProducts, user as userTable, settings as settingsTable, shippingZones,
} from "@/db/schema";
import { requireStaffOrAdmin, requireAdmin } from "@/lib/require-role";
import { uuidv7 } from "@/lib/id";
import { logAudit } from "@/server/audit";
import { syncRuleCollectionsForProduct } from "@/server/catalog";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

// ---------- Products ----------

const variantInput = z.object({
  id: z.string().optional(),
  labelEn: z.string().min(1),
  labelJa: z.string().min(1),
  weightGrams: z.number().int().positive(),
  priceJpy: z.number().int().nonnegative(),
  compareAtPriceJpy: z.number().int().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative(),
});

const productInput = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameJa: z.string().min(1),
  subtitleEn: z.string().optional(),
  subtitleJa: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionJa: z.string().optional(),
  cookingGuideEn: z.string().optional(),
  cookingGuideJa: z.string().optional(),
  origin: z.string().optional(),
  feed: z.string().optional(),
  grade: z.string().optional(),
  cut: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "scheduled"]).default("published"),
  isNewArrival: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  variants: z.array(variantInput).min(1),
});

export async function saveProductAction(input: z.infer<typeof productInput>) {
  const admin = await requireStaffOrAdmin();
  const parsed = productInput.parse(input);
  const productId = parsed.id ?? uuidv7();

  const values = {
    slug: parsed.slug,
    nameEn: parsed.nameEn,
    nameJa: parsed.nameJa,
    subtitleEn: parsed.subtitleEn ?? "",
    subtitleJa: parsed.subtitleJa ?? "",
    descriptionEn: parsed.descriptionEn ?? "",
    descriptionJa: parsed.descriptionJa ?? "",
    cookingGuideEn: parsed.cookingGuideEn ?? "",
    cookingGuideJa: parsed.cookingGuideJa ?? "",
    origin: parsed.origin ?? "",
    feed: parsed.feed || null,
    grade: parsed.grade || null,
    cut: parsed.cut || null,
    category: parsed.category,
    tagsCsv: parsed.tags.join(","),
    status: parsed.status,
    isNewArrival: parsed.isNewArrival,
  };

  if (parsed.id) {
    await db.update(products).set({ ...values, updatedAt: new Date() }).where(eq(products.id, parsed.id));
  } else {
    await db.insert(products).values({ id: productId, ...values });
  }

  // Replace variants wholesale — simplest correct approach for a CMS form.
  const existingVariants = await db.query.productVariants.findMany({ where: eq(productVariants.productId, productId) });
  const keepIds = new Set(parsed.variants.filter((v) => v.id).map((v) => v.id));
  for (const ev of existingVariants) {
    if (!keepIds.has(ev.id)) await db.delete(productVariants).where(eq(productVariants.id, ev.id));
  }
  for (const [i, v] of parsed.variants.entries()) {
    if (v.id) {
      await db
        .update(productVariants)
        .set({
          labelEn: v.labelEn, labelJa: v.labelJa, weightGrams: v.weightGrams,
          priceJpy: v.priceJpy, compareAtPriceJpy: v.compareAtPriceJpy ?? null, stock: v.stock, sortOrder: i,
        })
        .where(eq(productVariants.id, v.id));
    } else {
      await db.insert(productVariants).values({
        id: uuidv7(), productId, sku: `${parsed.slug.slice(0, 12).toUpperCase()}-${i + 1}-${Date.now().toString(36)}`,
        labelEn: v.labelEn, labelJa: v.labelJa, weightGrams: v.weightGrams,
        priceJpy: v.priceJpy, compareAtPriceJpy: v.compareAtPriceJpy ?? null, stock: v.stock, sortOrder: i,
      });
    }
  }

  const existingImages = await db.query.productImages.findMany({ where: eq(productImages.productId, productId) });
  for (const img of existingImages) await db.delete(productImages).where(eq(productImages.id, img.id));
  for (const [i, url] of parsed.images.entries()) {
    await db.insert(productImages).values({ id: uuidv7(), productId, url, alt: parsed.nameEn, sortOrder: i });
  }

  await syncRuleCollectionsForProduct(productId);
  await logAudit({
    actorId: admin.id, actorName: admin.name, action: parsed.id ? "product.update" : "product.create",
    targetType: "product", targetId: productId, detail: parsed.nameEn,
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, productId };
}

export async function deleteProductAction(id: string) {
  const admin = await requireStaffOrAdmin();
  await db.delete(products).where(eq(products.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "product.delete", targetType: "product", targetId: id });
  revalidatePath("/admin/products");
}

export async function adjustInventoryAction(input: { variantId: string; change: number; reason: string; note?: string }) {
  const admin = await requireStaffOrAdmin();
  await db
    .update(productVariants)
    .set({ stock: sql`GREATEST(0, ${productVariants.stock} + ${input.change})` })
    .where(eq(productVariants.id, input.variantId));
  await db.insert(inventoryMovements).values({
    id: uuidv7(), variantId: input.variantId, change: input.change, reason: input.reason,
    note: input.note ?? "", createdBy: admin.id,
  });
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "inventory.adjust", targetType: "variant", targetId: input.variantId, detail: `${input.change > 0 ? "+" : ""}${input.change} (${input.reason})` });
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
}

// ---------- Collections ----------

const collectionInput = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleJa: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionJa: z.string().optional(),
  heroImage: z.string().min(1),
  kind: z.enum(["manual", "rule"]),
  ruleTag: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export async function saveCollectionAction(input: z.infer<typeof collectionInput>) {
  const admin = await requireStaffOrAdmin();
  const parsed = collectionInput.parse(input);
  const values = {
    slug: parsed.slug, titleEn: parsed.titleEn, titleJa: parsed.titleJa,
    descriptionEn: parsed.descriptionEn ?? "", descriptionJa: parsed.descriptionJa ?? "",
    heroImage: parsed.heroImage, kind: parsed.kind, ruleTag: parsed.ruleTag || null, sortOrder: parsed.sortOrder,
    updatedAt: new Date(),
  };
  if (parsed.id) {
    await db.update(collections).set(values).where(eq(collections.id, parsed.id));
  } else {
    await db.insert(collections).values({ id: uuidv7(), ...values });
  }
  await logAudit({ actorId: admin.id, actorName: admin.name, action: parsed.id ? "collection.update" : "collection.create", targetType: "collection", detail: parsed.titleEn });
  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCollectionAction(id: string) {
  const admin = await requireStaffOrAdmin();
  await db.delete(productCollections).where(eq(productCollections.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "collection.delete", targetType: "collection", targetId: id });
  revalidatePath("/admin/collections");
}

// ---------- Orders ----------

export async function updateOrderStatusAction(orderId: string, status: string) {
  const admin = await requireStaffOrAdmin();
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "order.status", targetType: "order", targetId: orderId, detail: status });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function fulfillOrderAction(input: { orderId: string; carrier: "yamato" | "sagawa"; trackingNumber: string }) {
  const admin = await requireStaffOrAdmin();
  await db
    .update(orders)
    .set({ status: "shipped", carrier: input.carrier, trackingNumber: input.trackingNumber, updatedAt: new Date() })
    .where(eq(orders.id, input.orderId));
  const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
  if (order) {
    await sendEmail({
      to: order.email,
      subject: `Your order ${order.orderNumber} has shipped!`,
      html: `<p>Your order is on its way via ${input.carrier === "yamato" ? "Yamato Transport" : "Sagawa Express"}.</p><p>Tracking number: <b>${input.trackingNumber}</b></p>`,
    });
  }
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "order.fulfill", targetType: "order", targetId: input.orderId, detail: `${input.carrier} ${input.trackingNumber}` });
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(input: { orderId: string; amountJpy: number; reason: string }) {
  const admin = await requireStaffOrAdmin();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
  if (!order) throw new Error("Order not found");

  const stripe = getStripe();
  if (stripe && order.paymentIntentId) {
    await stripe.refunds.create({ payment_intent: order.paymentIntentId, amount: input.amountJpy });
  }

  await db.insert(refunds).values({ id: uuidv7(), orderId: input.orderId, amountJpy: input.amountJpy, reason: input.reason, createdBy: admin.id });
  const fullRefund = input.amountJpy >= order.totalJpy;
  await db.update(orders).set({ status: fullRefund ? "refunded" : order.status, updatedAt: new Date() }).where(eq(orders.id, input.orderId));

  await logAudit({ actorId: admin.id, actorName: admin.name, action: "order.refund", targetType: "order", targetId: input.orderId, detail: `¥${input.amountJpy} — ${input.reason}` });
  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

// ---------- Discounts ----------

const discountInput = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  kind: z.enum(["percent", "fixed", "free-shipping"]),
  value: z.number().int().nonnegative(),
  minSpendJpy: z.number().int().nonnegative().default(0),
  usageLimit: z.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
});

export async function saveDiscountAction(input: z.infer<typeof discountInput>) {
  const admin = await requireAdmin();
  const parsed = discountInput.parse(input);
  const values = {
    code: parsed.code.toUpperCase(), kind: parsed.kind, value: parsed.value, minSpendJpy: parsed.minSpendJpy,
    usageLimit: parsed.usageLimit ?? null, usageLimitPerCustomer: parsed.usageLimitPerCustomer ?? null, active: parsed.active,
  };
  if (parsed.id) {
    await db.update(discounts).set(values).where(eq(discounts.id, parsed.id));
  } else {
    await db.insert(discounts).values({ id: uuidv7(), ...values });
  }
  await logAudit({ actorId: admin.id, actorName: admin.name, action: parsed.id ? "discount.update" : "discount.create", targetType: "discount", detail: values.code });
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function deleteDiscountAction(id: string) {
  const admin = await requireAdmin();
  await db.delete(discounts).where(eq(discounts.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "discount.delete", targetType: "discount", targetId: id });
  revalidatePath("/admin/discounts");
}

// ---------- Reviews / Q&A moderation ----------

export async function moderateReviewAction(id: string, status: "approved" | "hidden") {
  const admin = await requireStaffOrAdmin();
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (review) {
    const ratings = await db.query.reviews.findMany({ where: eq(reviews.productId, review.productId) });
    const approved = ratings.filter((r) => r.status === "approved");
    const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;
    await db.update(products).set({ ratingAvg: Math.round(avg * 10) / 10, ratingCount: approved.length }).where(eq(products.id, review.productId));
  }
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "review.moderate", targetType: "review", targetId: id, detail: status });
  revalidatePath("/admin/reviews");
}

export async function answerQuestionAction(input: { questionId: string; body: string }) {
  const admin = await requireStaffOrAdmin();
  await db.insert(answers).values({ id: uuidv7(), questionId: input.questionId, authorName: admin.name, body: input.body });
  await db.update(questions).set({ status: "answered" }).where(eq(questions.id, input.questionId));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "question.answer", targetType: "question", targetId: input.questionId });
  revalidatePath("/admin/reviews");
}

export async function hideQuestionAction(id: string) {
  const admin = await requireStaffOrAdmin();
  await db.update(questions).set({ status: "hidden" }).where(eq(questions.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "question.hide", targetType: "question", targetId: id });
  revalidatePath("/admin/reviews");
}

// ---------- Recipes CMS ----------

const recipeInput = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleJa: z.string().min(1),
  excerptEn: z.string().optional(),
  excerptJa: z.string().optional(),
  bodyEn: z.string().optional(),
  bodyJa: z.string().optional(),
  heroImage: z.string().min(1),
  category: z.string().default("grill"),
  cookTimeMinutes: z.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  servings: z.number().int().positive(),
  status: z.enum(["draft", "published"]),
  productIds: z.array(z.string()).default([]),
});

export async function saveRecipeAction(input: z.infer<typeof recipeInput>) {
  const admin = await requireStaffOrAdmin();
  const parsed = recipeInput.parse(input);
  const recipeId = parsed.id ?? uuidv7();
  const values = {
    slug: parsed.slug, titleEn: parsed.titleEn, titleJa: parsed.titleJa,
    excerptEn: parsed.excerptEn ?? "", excerptJa: parsed.excerptJa ?? "",
    bodyEn: parsed.bodyEn ?? "", bodyJa: parsed.bodyJa ?? "",
    heroImage: parsed.heroImage, category: parsed.category, cookTimeMinutes: parsed.cookTimeMinutes,
    difficulty: parsed.difficulty, servings: parsed.servings, status: parsed.status,
  };
  if (parsed.id) {
    await db.update(recipes).set(values).where(eq(recipes.id, parsed.id));
    const existing = await db.query.recipeProducts.findMany({ where: eq(recipeProducts.recipeId, parsed.id) });
    for (const e of existing) await db.delete(recipeProducts).where(eq(recipeProducts.id, e.id));
  } else {
    await db.insert(recipes).values({ id: recipeId, ...values });
  }
  for (const productId of parsed.productIds) {
    await db.insert(recipeProducts).values({ id: uuidv7(), recipeId, productId, quantityLabel: "1" });
  }
  await logAudit({ actorId: admin.id, actorName: admin.name, action: parsed.id ? "recipe.update" : "recipe.create", targetType: "recipe", detail: parsed.titleEn });
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  return { ok: true, recipeId };
}

export async function deleteRecipeAction(id: string) {
  const admin = await requireStaffOrAdmin();
  await db.delete(recipes).where(eq(recipes.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "recipe.delete", targetType: "recipe", targetId: id });
  revalidatePath("/admin/recipes");
}

// ---------- Customers ----------

export async function setCustomerRoleAction(userId: string, role: "customer" | "staff" | "admin") {
  const admin = await requireAdmin();
  await db.update(userTable).set({ role }).where(eq(userTable.id, userId));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "customer.role", targetType: "user", targetId: userId, detail: role });
  revalidatePath("/admin/customers");
}

export async function banCustomerAction(userId: string, banned: boolean) {
  const admin = await requireAdmin();
  await db.update(userTable).set({ banned }).where(eq(userTable.id, userId));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: banned ? "customer.ban" : "customer.unban", targetType: "user", targetId: userId });
  revalidatePath("/admin/customers");
}

export async function adjustPointsAction(userId: string, points: number, reason: string) {
  const admin = await requireAdmin();
  const { loyaltyLedger } = await import("@/db/schema");
  await db.insert(loyaltyLedger).values({ id: uuidv7(), userId, points, reason: "adjustment" });
  await db.update(userTable).set({ pointsBalance: sql`${userTable.pointsBalance} + ${points}` }).where(eq(userTable.id, userId));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "customer.points", targetType: "user", targetId: userId, detail: `${points} (${reason})` });
  revalidatePath("/admin/customers");
}

// ---------- Inquiries ----------

export async function replyInquiryAction(input: { id: string; message: string }) {
  const admin = await requireStaffOrAdmin();
  const inquiry = await db.query.inquiries.findFirst({ where: (i, { eq }) => eq(i.id, input.id) });
  if (inquiry) {
    await sendEmail({ to: inquiry.email, subject: "Re: Your inquiry to Whole Cuts", html: `<p>${input.message}</p>` });
  }
  const { inquiries: inquiriesTable } = await import("@/db/schema");
  await db.update(inquiriesTable).set({ status: "replied" }).where(eq(inquiriesTable.id, input.id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "inquiry.reply", targetType: "inquiry", targetId: input.id });
  revalidatePath("/admin/inquiries");
}

export async function closeInquiryAction(id: string) {
  const admin = await requireStaffOrAdmin();
  const { inquiries: inquiriesTable } = await import("@/db/schema");
  await db.update(inquiriesTable).set({ status: "closed" }).where(eq(inquiriesTable.id, id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "inquiry.close", targetType: "inquiry", targetId: id });
  revalidatePath("/admin/inquiries");
}

// ---------- Settings ----------

export async function saveSettingAction(key: string, value: unknown) {
  const admin = await requireAdmin();
  await db
    .insert(settingsTable)
    .values({ key, value: JSON.stringify(value), updatedAt: new Date() })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: JSON.stringify(value), updatedAt: new Date() } });
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "settings.update", targetType: "setting", targetId: key });
  revalidatePath("/admin/settings");
}

export async function saveShippingZoneAction(input: { id: string; baseFeeJpy: number; surchargeJpy: number }) {
  const admin = await requireAdmin();
  await db.update(shippingZones).set({ baseFeeJpy: input.baseFeeJpy, surchargeJpy: input.surchargeJpy }).where(eq(shippingZones.id, input.id));
  await logAudit({ actorId: admin.id, actorName: admin.name, action: "shipping.update", targetType: "shippingZone", targetId: input.id });
  revalidatePath("/admin/settings");
}
