import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { productVariants, discounts, discountRedemptions } from "@/db/schema";
import { shippingFeeFor } from "@/lib/shipping";
import { taxInclusiveBreakdown } from "@/lib/tax";

export type PriceableItem = { variantId: string; quantity: number };

export type PricingResult = {
  subtotalJpy: number;
  discountJpy: number;
  shippingJpy: number;
  taxJpy: number;
  totalJpy: number;
  pointsEarned: number;
  pointsRedeemedValueJpy: number;
  discountError?: string;
  lines: Array<{
    variantId: string;
    productId: string;
    quantity: number;
    unitPriceJpy: number;
    lineTotalJpy: number;
    stock: number;
  }>;
};

/**
 * Recomputes the entire order total server-side. Never trust client-sent
 * totals — this is the single source of truth used by both the cart
 * summary and the checkout server action.
 */
export async function priceCart(opts: {
  items: PriceableItem[];
  prefecture?: string;
  promoCode?: string | null;
  redeemPoints?: number;
  userId?: string | null;
}): Promise<PricingResult> {
  const { items, prefecture, promoCode, redeemPoints = 0, userId } = opts;

  if (items.length === 0) {
    return {
      subtotalJpy: 0,
      discountJpy: 0,
      shippingJpy: 0,
      taxJpy: 0,
      totalJpy: 0,
      pointsEarned: 0,
      pointsRedeemedValueJpy: 0,
      lines: [],
    };
  }

  const variantIds = items.map((i) => i.variantId);
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines = items
    .filter((i) => byId.has(i.variantId))
    .map((i) => {
      const v = byId.get(i.variantId)!;
      const quantity = Math.max(1, Math.min(i.quantity, v.stock > 0 ? v.stock : i.quantity));
      return {
        variantId: v.id,
        productId: v.productId,
        quantity,
        unitPriceJpy: v.priceJpy,
        lineTotalJpy: v.priceJpy * quantity,
        stock: v.stock,
      };
    });

  const subtotalJpy = lines.reduce((sum, l) => sum + l.lineTotalJpy, 0);

  let discountJpy = 0;
  let discountError: string | undefined;
  if (promoCode) {
    const code = await db.query.discounts.findFirst({
      where: eq(discounts.code, promoCode.toUpperCase()),
    });
    const now = Date.now();
    if (!code || !code.active) {
      discountError = "Promo code not found.";
    } else if (code.startsAt && now < code.startsAt.getTime()) {
      discountError = "Promo code is not active yet.";
    } else if (code.endsAt && now > code.endsAt.getTime()) {
      discountError = "Promo code has expired.";
    } else if (subtotalJpy < code.minSpendJpy) {
      discountError = `Minimum spend of ¥${code.minSpendJpy.toLocaleString()} required.`;
    } else if (code.usageLimit != null && code.timesUsed >= code.usageLimit) {
      discountError = "Promo code usage limit reached.";
    } else {
      if (userId && code.usageLimitPerCustomer != null) {
        const used = await db.query.discountRedemptions.findMany({
          where: and(eq(discountRedemptions.discountId, code.id), eq(discountRedemptions.userId, userId)),
        });
        if (used.length >= code.usageLimitPerCustomer) {
          discountError = "You've already used this promo code.";
        }
      }
      if (!discountError) {
        if (code.kind === "percent") discountJpy = Math.round((subtotalJpy * code.value) / 100);
        else if (code.kind === "fixed") discountJpy = Math.min(code.value, subtotalJpy);
        else if (code.kind === "free-shipping") discountJpy = 0; // handled via shipping below
      }
    }
  }

  const isFreeShipping = promoCode && !discountError && (await isFreeShippingCode(promoCode));
  const afterDiscount = Math.max(0, subtotalJpy - discountJpy);
  const shippingJpy = isFreeShipping ? 0 : shippingFeeFor(prefecture || "Tokyo", afterDiscount);

  const pointsRedeemedValueJpy = Math.min(redeemPoints, Math.floor(afterDiscount * 0.5));
  const totalJpy = Math.max(0, afterDiscount + shippingJpy - pointsRedeemedValueJpy);
  const { tax } = taxInclusiveBreakdown(totalJpy);
  const pointsEarned = Math.floor(totalJpy * 0.01);

  return {
    subtotalJpy,
    discountJpy,
    shippingJpy,
    taxJpy: tax,
    totalJpy,
    pointsEarned,
    pointsRedeemedValueJpy,
    discountError,
    lines,
  };
}

async function isFreeShippingCode(promoCode: string): Promise<boolean> {
  const code = await db.query.discounts.findFirst({ where: eq(discounts.code, promoCode.toUpperCase()) });
  return code?.kind === "free-shipping";
}
