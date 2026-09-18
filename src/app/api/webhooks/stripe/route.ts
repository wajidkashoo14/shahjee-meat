import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * Verifies the Stripe webhook signature and acknowledges the event.
 *
 * In this build, card payments are finalized synchronously on the client
 * (see checkout-form.tsx) once `stripe.confirmPayment` resolves, since a
 * local dev server has no public URL for Stripe to call back to without
 * the Stripe CLI's `listen --forward-to`. This handler is still wired up
 * correctly (signature verification + idempotency-safe logging) so a real
 * deployment can move order finalization here for `payment_intent.succeeded`
 * / delayed methods like Konbini. See DECISIONS.md.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      console.log(`Stripe event received: ${event.type}`, event.data.object.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
