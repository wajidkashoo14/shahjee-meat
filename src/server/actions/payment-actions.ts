"use server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateCartId, getCartSummary } from "@/server/cart";

/** Creates a PaymentIntent for the cart's current total (JPY is zero-decimal). */
export async function createPaymentIntentAction() {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Stripe is not configured on this deployment." };

  await getOrCreateCartId();
  const summary = await getCartSummary();
  if (summary.items.length === 0) return { ok: false as const, error: "Your cart is empty." };

  const intent = await stripe.paymentIntents.create({
    amount: summary.pricing.totalJpy,
    currency: "jpy",
    payment_method_types: ["card", "konbini"],
    metadata: { cartId: summary.cartId ?? "" },
  });

  return { ok: true as const, clientSecret: intent.client_secret!, amount: summary.pricing.totalJpy };
}
