"use server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  orders, wishlists, stockAlerts, addresses, reviews, subscriptions, user as userTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { uuidv7 } from "@/lib/id";
import { addItemToCart } from "@/server/cart";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not signed in");
  return session.user;
}

export async function reorderAction(orderId: string) {
  const user = await requireUser();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order || order.userId !== user.id) throw new Error("Order not found");
  for (const item of order.items) {
    if (item.variantId) await addItemToCart(item.variantId, item.quantity);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cancelOrderAction(orderId: string) {
  const user = await requireUser();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.userId !== user.id) throw new Error("Order not found");
  if (order.cancelCutoffAt && order.cancelCutoffAt.getTime() < Date.now()) {
    return { ok: false, error: "cancelWindowClosed" as const };
  }
  if (order.status !== "paid") return { ok: false, error: "cancelWindowClosed" as const };
  await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
  revalidatePath("/account/orders");
  return { ok: true as const };
}

export async function removeWishlistItemAction(wishlistId: string) {
  const user = await requireUser();
  await db.delete(wishlists).where(and(eq(wishlists.id, wishlistId), eq(wishlists.userId, user.id)));
  revalidatePath("/account/wishlist");
}

export async function removeStockAlertAction(alertId: string) {
  const user = await requireUser();
  await db.delete(stockAlerts).where(and(eq(stockAlerts.id, alertId), eq(stockAlerts.userId, user.id)));
  revalidatePath("/account/alerts");
}

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  fullName: z.string().min(1),
  fullNameKana: z.string().default(""),
  phone: z.string().min(8),
  postalCode: z.string().min(3),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function saveAddressAction(input: z.infer<typeof addressSchema>) {
  const user = await requireUser();
  const parsed = addressSchema.parse(input);

  if (parsed.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }

  if (parsed.id) {
    await db
      .update(addresses)
      .set({ ...parsed, addressLine2: parsed.addressLine2 ?? "" })
      .where(and(eq(addresses.id, parsed.id), eq(addresses.userId, user.id)));
  } else {
    await db.insert(addresses).values({ id: uuidv7(), userId: user.id, ...parsed, addressLine2: parsed.addressLine2 ?? "" });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(id: string) {
  const user = await requireUser();
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(id: string) {
  const user = await requireUser();
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  await db.update(addresses).set({ isDefault: true }).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function deleteMyReviewAction(reviewId: string) {
  const user = await requireUser();
  await db.delete(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, user.id)));
  revalidatePath("/account/reviews");
}

export async function updateSubscriptionStatusAction(subscriptionId: string, status: "active" | "paused" | "cancelled") {
  const user = await requireUser();
  await db
    .update(subscriptions)
    .set({ status })
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, user.id)));
  revalidatePath("/account/subscriptions");
}

const profileSchema = z.object({ name: z.string().min(1), phone: z.string().optional(), locale: z.enum(["en", "ja"]) });

export async function updateProfileAction(input: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const parsed = profileSchema.parse(input);
  await db.update(userTable).set({ name: parsed.name, phone: parsed.phone, locale: parsed.locale }).where(eq(userTable.id, user.id));
  revalidatePath("/account/settings");
  return { ok: true };
}

export async function exportMyDataAction() {
  const user = await requireUser();
  const myOrders = await db.query.orders.findMany({ where: eq(orders.userId, user.id), with: { items: true } });
  const myAddresses = await db.query.addresses.findMany({ where: eq(addresses.userId, user.id) });
  const myWishlist = await db.query.wishlists.findMany({ where: eq(wishlists.userId, user.id) });
  return { ok: true, data: { user, orders: myOrders, addresses: myAddresses, wishlist: myWishlist } };
}

export async function deleteMyAccountAction() {
  const user = await requireUser();
  await db.update(orders).set({ userId: null }).where(eq(orders.userId, user.id)); // keep order history for accounting, detach from user
  await db.delete(userTable).where(eq(userTable.id, user.id)); // cascades sessions, accounts, addresses, wishlist, etc.
  return { ok: true };
}
