"use client";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPaymentIntentAction } from "@/server/actions/payment-actions";
import { formatJpy } from "@/lib/utils";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function StripePaymentSection({
  amount,
  onPaid,
  disabled,
}: {
  amount: number;
  onPaid: (paymentIntentId: string) => void;
  disabled?: boolean;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("checkout");

  useEffect(() => {
    createPaymentIntentAction().then((res) => {
      if (res.ok) setClientSecret(res.clientSecret);
      else setError(res.error);
    });
  }, []);

  if (error) return <p className="text-sm text-sale">{error}</p>;
  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Loader2 className="size-4 animate-spin" /> {t("loadingPayment")}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
      <StripeInner amount={amount} onPaid={onPaid} disabled={disabled} />
    </Elements>
  );
}

function StripeInner({ amount, onPaid, disabled }: { amount: number; onPaid: (id: string) => void; disabled?: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("checkout");

  async function handlePay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (submitError) {
      setError(submitError.message ?? "Payment failed.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onPaid(paymentIntent.id);
    } else {
      setError(t("paymentIncomplete"));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-sale">{error}</p>}
      <Button size="lg" onClick={handlePay} disabled={disabled || submitting || !stripe}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {t("payAmount", { amount: formatJpy(amount) })}
      </Button>
    </div>
  );
}
