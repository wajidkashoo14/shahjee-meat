import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, sqlite } from "@/db";
import {
  orders,
  orderItems,
  productVariants,
  products,
  productImages,
  inventoryMovements,
  loyaltyLedger,
  discounts,
  discountRedemptions,
  user as userTable,
} from "@/db/schema";
import { uuidv7, orderNumber } from "@/lib/id";
import { priceCart } from "@/lib/pricing";
import { sendEmail } from "@/lib/email";
import { clearCart } from "@/server/cart";

export type ShippingInfo = {
  email: string;
  fullName: string;
  fullNameKana: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  deliveryDate: string;
  deliverySlot: string;
  giftNote?: string;
  paymentMethod: "test" | "stripe" | "konbini";
  paymentIntentId?: string;
  promoCode?: string | null;
  redeemPoints?: number;
};

export class OutOfStockError extends Error {}

/**
 * Places an order: re-prices everything server-side, reserves stock inside
 * a transaction (so two buyers can't both take the last unit), snapshots
 * line items, awards loyalty points, and clears the cart. This is the
 * single place an order is ever created.
 */
export async function placeOrder(cartId: string, userId: string | null, info: ShippingInfo) {
  const cartItemRows = await db.query.cartItems.findMany({ where: (ci, { eq }) => eq(ci.cartId, cartId) });
  if (cartItemRows.length === 0) throw new Error("Cart is empty");

  const pricing = await priceCart({
    items: cartItemRows.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    prefecture: info.prefecture,
    promoCode: info.promoCode,
    redeemPoints: info.redeemPoints ?? 0,
    userId,
  });
  if (pricing.discountError) throw new Error(pricing.discountError);

  const orderId = uuidv7();
  const orderNo = orderNumber();

  const runTxn = sqlite.transaction(() => {
    for (const line of pricing.lines) {
      const variant = db.select().from(productVariants).where(eq(productVariants.id, line.variantId)).get();
      if (!variant || variant.stock < line.quantity) {
        throw new OutOfStockError(`Not enough stock for variant ${line.variantId}`);
      }
      db.update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${line.quantity}` })
        .where(eq(productVariants.id, line.variantId))
        .run();
      db.insert(inventoryMovements)
        .values({ id: uuidv7(), variantId: line.variantId, change: -line.quantity, reason: "order", note: orderNo })
        .run();
    }

    db.insert(orders)
      .values({
        id: orderId,
        orderNumber: orderNo,
        userId,
        email: info.email,
        status: "paid",
        subtotalJpy: pricing.subtotalJpy,
        shippingJpy: pricing.shippingJpy,
        discountJpy: pricing.discountJpy,
        taxJpy: pricing.taxJpy,
        totalJpy: pricing.totalJpy,
        pointsEarned: pricing.pointsEarned,
        pointsRedeemed: info.redeemPoints ?? 0,
        promoCode: info.promoCode || null,
        shippingName: info.fullName,
        shippingNameKana: info.fullNameKana,
        shippingPhone: info.phone,
        shippingPostalCode: info.postalCode,
        shippingPrefecture: info.prefecture,
        shippingCity: info.city,
        shippingAddressLine1: info.addressLine1,
        shippingAddressLine2: info.addressLine2 || "",
        deliveryDate: info.deliveryDate,
        deliverySlot: info.deliverySlot,
        giftNote: info.giftNote || "",
        paymentMethod: info.paymentMethod,
        paymentIntentId: info.paymentIntentId ?? null,
        cancelCutoffAt: new Date(Date.now() + 12 * 3600 * 1000),
      })
      .run();

    for (const line of pricing.lines) {
      const variant = db.select().from(productVariants).where(eq(productVariants.id, line.variantId)).get()!;
      const product = db.select().from(products).where(eq(products.id, line.productId)).get()!;
      const image = db.select().from(productImages).where(eq(productImages.productId, line.productId)).get();
      db.insert(orderItems)
        .values({
          id: uuidv7(),
          orderId,
          productId: product.id,
          variantId: variant.id,
          nameEn: product.nameEn,
          nameJa: product.nameJa,
          variantLabelEn: variant.labelEn,
          variantLabelJa: variant.labelJa,
          image: image?.url ?? "",
          unitPriceJpy: line.unitPriceJpy,
          quantity: line.quantity,
          lineTotalJpy: line.lineTotalJpy,
        })
        .run();
    }

    if (userId) {
      if (pricing.pointsEarned > 0) {
        db.insert(loyaltyLedger)
          .values({ id: uuidv7(), userId, points: pricing.pointsEarned, reason: "order", orderId })
          .run();
      }
      if ((info.redeemPoints ?? 0) > 0) {
        db.insert(loyaltyLedger)
          .values({ id: uuidv7(), userId, points: -(info.redeemPoints ?? 0), reason: "redeem", orderId })
          .run();
      }
      const net = pricing.pointsEarned - (info.redeemPoints ?? 0);
      db.update(userTable)
        .set({ pointsBalance: sql`${userTable.pointsBalance} + ${net}` })
        .where(eq(userTable.id, userId))
        .run();
    }

    if (info.promoCode) {
      const code = db.select().from(discounts).where(eq(discounts.code, info.promoCode.toUpperCase())).get();
      if (code) {
        db.update(discounts)
          .set({ timesUsed: sql`${discounts.timesUsed} + 1` })
          .where(eq(discounts.id, code.id))
          .run();
        db.insert(discountRedemptions).values({ id: uuidv7(), discountId: code.id, orderId, userId }).run();
      }
    }
  });

  runTxn();

  await clearCart(cartId);

  await sendEmail({
    to: info.email,
    subject: `Order confirmed — ${orderNo}`,
    html: `<p>Thanks for your order! Your order <b>${orderNo}</b> totaling ¥${pricing.totalJpy.toLocaleString()} has been confirmed and will arrive on ${info.deliveryDate}.</p>`,
  });

  return { orderId, orderNumber: orderNo, total: pricing.totalJpy };
}
