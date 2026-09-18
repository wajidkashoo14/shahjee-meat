import "server-only";
import { cookies, headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { carts, cartItems, productVariants, products } from "@/db/schema";
import { uuidv7 } from "@/lib/id";
import { auth } from "@/lib/auth";
import { priceCart } from "@/lib/pricing";

const GUEST_COOKIE = "wc_guest_cart";

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/** Finds (or lazily creates) the cart for the current visitor — signed-in or guest. */
export async function getOrCreateCartId(): Promise<string> {
  const userId = await getCurrentUserId();
  const cookieStore = await cookies();

  if (userId) {
    const existing = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
    if (existing) return existing.id;
    const id = uuidv7();
    await db.insert(carts).values({ id, userId });
    return id;
  }

  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (guestToken) {
    const existing = await db.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
    if (existing) return existing.id;
  }

  const token = uuidv7();
  const id = uuidv7();
  await db.insert(carts).values({ id, guestToken: token });
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
  return id;
}

/**
 * Read-only lookup for use in plain Server Components (e.g. the root
 * layout), where Next.js disallows writing cookies. Never creates a cart
 * or sets the guest cookie — that only happens lazily, inside a Server
 * Action, the first time something is actually added to the cart.
 */
export async function peekCartId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (userId) {
    const existing = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
    return existing?.id ?? null;
  }
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestToken) return null;
  const existing = await db.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
  return existing?.id ?? null;
}

/** Called right after sign-in so items added as a guest aren't lost. */
export async function mergeGuestCartIntoUser(userId: string) {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestToken) return;

  const guestCart = await db.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
  if (!guestCart) return;

  const userCart = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
  if (!userCart) {
    await db.update(carts).set({ userId, guestToken: null }).where(eq(carts.id, guestCart.id));
    cookieStore.delete(GUEST_COOKIE);
    return;
  }

  const guestItems = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, guestCart.id) });
  for (const item of guestItems) {
    const existing = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, userCart.id), eq(cartItems.variantId, item.variantId)),
    });
    if (existing) {
      await db.update(cartItems).set({ quantity: existing.quantity + item.quantity }).where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({ id: uuidv7(), cartId: userCart.id, variantId: item.variantId, quantity: item.quantity });
    }
  }
  await db.delete(carts).where(eq(carts.id, guestCart.id));
  cookieStore.delete(GUEST_COOKIE);
}

const EMPTY_SUMMARY = {
  cartId: null as string | null,
  promoCode: null as string | null,
  giftNote: "",
  deliveryDate: null as string | null,
  deliverySlot: null as string | null,
  itemCount: 0,
  items: [] as CartSummary["items"],
  pricing: {
    subtotalJpy: 0,
    discountJpy: 0,
    shippingJpy: 0,
    taxJpy: 0,
    totalJpy: 0,
    pointsEarned: 0,
    pointsRedeemedValueJpy: 0,
    lines: [] as Awaited<ReturnType<typeof priceCart>>["lines"],
  },
};

/** Safe to call from a plain Server Component render — never writes cookies. */
export async function getCartSummaryForRender() {
  const cartId = await peekCartId();
  if (!cartId) return EMPTY_SUMMARY as Awaited<ReturnType<typeof buildCartSummary>>;
  return buildCartSummary(cartId);
}

/** Call from Server Actions only (mutates: creates the cart / guest cookie if needed). */
export async function getCartSummary() {
  const cartId = await getOrCreateCartId();
  return buildCartSummary(cartId);
}

async function buildCartSummary(cartId: string) {
  const cart = await db.query.carts.findFirst({ where: eq(carts.id, cartId) });
  const items = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      variantId: productVariants.id,
      sku: productVariants.sku,
      labelEn: productVariants.labelEn,
      labelJa: productVariants.labelJa,
      weightGrams: productVariants.weightGrams,
      priceJpy: productVariants.priceJpy,
      compareAtPriceJpy: productVariants.compareAtPriceJpy,
      stock: productVariants.stock,
      productId: products.id,
      productSlug: products.slug,
      nameEn: products.nameEn,
      nameJa: products.nameJa,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

  const images = await db.query.productImages.findMany();
  const imageByProduct = new Map<string, string>();
  for (const img of images) {
    if (!imageByProduct.has(img.productId)) imageByProduct.set(img.productId, img.url);
  }

  const userId = await getCurrentUserId();
  const pricing = await priceCart({
    items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    promoCode: cart?.promoCode,
    userId,
  });

  const lineById = new Map(pricing.lines.map((l) => [l.variantId, l]));

  return {
    cartId,
    promoCode: cart?.promoCode ?? null,
    giftNote: cart?.giftNote ?? "",
    deliveryDate: cart?.deliveryDate ?? null,
    deliverySlot: cart?.deliverySlot ?? null,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    items: items.map((i) => ({
      ...i,
      image: imageByProduct.get(i.productId) ?? "",
      lineTotalJpy: lineById.get(i.variantId)?.lineTotalJpy ?? i.priceJpy * i.quantity,
    })),
    pricing,
  };
}

export type CartSummary = Awaited<ReturnType<typeof buildCartSummary>>;

export async function addItemToCart(variantId: string, quantity = 1) {
  const cartId = await getOrCreateCartId();
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)),
  });
  if (existing) {
    await db.update(cartItems).set({ quantity: existing.quantity + quantity }).where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ id: uuidv7(), cartId, variantId, quantity });
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  }
}

export async function removeCartItem(itemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
}

export async function setCartPromoCode(code: string | null) {
  const cartId = await getOrCreateCartId();
  await db.update(carts).set({ promoCode: code }).where(eq(carts.id, cartId));
}

export async function setCartDelivery(date: string, slot: string) {
  const cartId = await getOrCreateCartId();
  await db.update(carts).set({ deliveryDate: date, deliverySlot: slot }).where(eq(carts.id, cartId));
}

export async function setCartGiftNote(note: string) {
  const cartId = await getOrCreateCartId();
  await db.update(carts).set({ giftNote: note }).where(eq(carts.id, cartId));
}

export async function clearCart(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.update(carts).set({ promoCode: null, giftNote: "" }).where(eq(carts.id, cartId));
}
