"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as cart from "@/server/cart";

export async function addToCartAction(input: { variantId: string; quantity?: number }) {
  const schema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(99).optional() });
  const parsed = schema.parse(input);
  await cart.addItemToCart(parsed.variantId, parsed.quantity ?? 1);
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

export async function updateCartItemAction(input: { itemId: string; quantity: number }) {
  const schema = z.object({ itemId: z.string().min(1), quantity: z.number().int().min(0).max(99) });
  const parsed = schema.parse(input);
  await cart.updateCartItemQuantity(parsed.itemId, parsed.quantity);
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

export async function removeCartItemAction(itemId: string) {
  await cart.removeCartItem(itemId);
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

export async function applyPromoCodeAction(code: string) {
  await cart.setCartPromoCode(code || null);
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

export async function setDeliveryAction(input: { date: string; slot: string }) {
  await cart.setCartDelivery(input.date, input.slot);
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

export async function setGiftNoteAction(note: string) {
  await cart.setCartGiftNote(note);
  return cart.getCartSummary();
}

export async function getCartSummaryAction() {
  return cart.getCartSummary();
}

/** Adds one of every product linked to a recipe (its cheapest in-stock variant) to the cart. */
export async function shopRecipeAction(recipeId: string) {
  const { db } = await import("@/db");
  const { recipeProducts, productVariants } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const links = await db.query.recipeProducts.findMany({ where: eq(recipeProducts.recipeId, recipeId) });
  for (const link of links) {
    const variants = await db.query.productVariants.findMany({ where: eq(productVariants.productId, link.productId) });
    const inStock = variants.find((v) => v.stock > 0);
    if (inStock) await cart.addItemToCart(inStock.id, 1);
  }
  revalidatePath("/", "layout");
  return cart.getCartSummary();
}

/** Recomputes pricing for the checkout page as the shipping prefecture or points-redemption choice changes. */
export async function repriceForCheckoutAction(input: { prefecture: string; promoCode?: string | null; redeemPoints?: number }) {
  const { getOrCreateCartId, getCurrentUserId } = cart;
  const cartId = await getOrCreateCartId();
  const cartItemRows = await import("@/db").then(({ db }) =>
    db.query.cartItems.findMany({ where: (ci, { eq }) => eq(ci.cartId, cartId) }),
  );
  const { priceCart } = await import("@/lib/pricing");
  const userId = await getCurrentUserId();
  return priceCart({
    items: cartItemRows.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    prefecture: input.prefecture,
    promoCode: input.promoCode,
    redeemPoints: input.redeemPoints ?? 0,
    userId,
  });
}
