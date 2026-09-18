import Stripe from "stripe";

let client: Stripe | null | undefined;

/**
 * Returns a Stripe client only when STRIPE_SECRET_KEY is configured.
 * Checkout falls back to a "test/COD" payment method when this is null,
 * so the full order flow still works without a live Stripe account.
 * See DECISIONS.md.
 */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
