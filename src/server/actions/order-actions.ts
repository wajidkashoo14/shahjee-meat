"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateCartId } from "@/server/cart";
import { placeOrder, OutOfStockError, type ShippingInfo } from "@/server/orders";

const shippingSchema = z.object({
  email: z.email(),
  fullName: z.string().min(1),
  fullNameKana: z.string().default(""),
  phone: z.string().min(8),
  postalCode: z.string().min(3),
  prefecture: z.string().min(1),
  city: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  deliveryDate: z.string().min(1),
  deliverySlot: z.string().min(1),
  giftNote: z.string().optional(),
  paymentMethod: z.enum(["test", "stripe", "konbini"]),
  paymentIntentId: z.string().optional(),
  promoCode: z.string().nullable().optional(),
  redeemPoints: z.number().int().min(0).optional(),
  saveAddress: z.boolean().optional(),
});

export async function placeOrderAction(input: z.infer<typeof shippingSchema>) {
  const parsed = shippingSchema.parse(input);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;
  const cartId = await getOrCreateCartId();

  try {
    const result = await placeOrder(cartId, userId, parsed as ShippingInfo);

    if (userId && parsed.saveAddress) {
      const { db } = await import("@/db");
      const { addresses } = await import("@/db/schema");
      const { uuidv7 } = await import("@/lib/id");
      await db.insert(addresses).values({
        id: uuidv7(),
        userId,
        label: "Home",
        fullName: parsed.fullName,
        fullNameKana: parsed.fullNameKana ?? "",
        phone: parsed.phone,
        postalCode: parsed.postalCode,
        prefecture: parsed.prefecture,
        city: parsed.city,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2 ?? "",
        isDefault: false,
      });
    }

    return { ok: true as const, ...result };
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return { ok: false as const, error: "One or more items just sold out. Please review your cart." };
    }
    return { ok: false as const, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}
