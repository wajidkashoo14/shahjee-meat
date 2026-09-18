"use client";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AddressFields, type AddressValue } from "@/components/checkout/address-fields";
import { StripePaymentSection } from "@/components/checkout/stripe-payment-section";
import { placeOrderAction } from "@/server/actions/order-actions";
import { repriceForCheckoutAction } from "@/server/actions/cart-actions";
import type { CartSummary } from "@/server/cart";
import type { addresses } from "@/db/schema";
import { formatJpy } from "@/lib/utils";
import { DELIVERY_SLOTS } from "@/lib/shipping";
import { nextAvailableDeliveryDates } from "@/lib/delivery";

type SavedAddress = typeof addresses.$inferSelect;

export function CheckoutForm({
  initialSummary,
  savedAddresses,
  userEmail,
  userName,
  stripeEnabled,
}: {
  initialSummary: CartSummary;
  savedAddresses: SavedAddress[];
  userEmail?: string;
  userName?: string;
  stripeEnabled: boolean;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "en" | "ja";
  const router = useRouter();
  const dates = useMemo(() => nextAvailableDeliveryDates(14), []);

  const [email, setEmail] = useState(userEmail ?? "");
  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [address, setAddress] = useState<AddressValue>({
    fullName: defaultAddr?.fullName ?? userName ?? "",
    fullNameKana: defaultAddr?.fullNameKana ?? "",
    phone: defaultAddr?.phone ?? "",
    postalCode: defaultAddr?.postalCode ?? "",
    prefecture: defaultAddr?.prefecture ?? "Tokyo",
    city: defaultAddr?.city ?? "",
    addressLine1: defaultAddr?.addressLine1 ?? "",
    addressLine2: defaultAddr?.addressLine2 ?? "",
  });
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr?.id ?? "new");
  const [saveAddress, setSaveAddress] = useState(false);
  const [date, setDate] = useState(initialSummary.deliveryDate || dates[0]);
  const [slot, setSlot] = useState(initialSummary.deliverySlot || DELIVERY_SLOTS[0].id);
  const [giftNote] = useState(initialSummary.giftNote);
  const [pricing, setPricing] = useState(initialSummary.pricing);
  const [pending, startTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);

  function pickSavedAddress(id: string) {
    setSelectedAddressId(id);
    if (id === "new") return;
    const a = savedAddresses.find((sa) => sa.id === id);
    if (a) {
      setAddress({
        fullName: a.fullName,
        fullNameKana: a.fullNameKana,
        phone: a.phone,
        postalCode: a.postalCode,
        prefecture: a.prefecture,
        city: a.city,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
      });
      reprice(a.prefecture);
    }
  }

  function reprice(prefecture: string) {
    startTransition(async () => {
      const next = await repriceForCheckoutAction({ prefecture, promoCode: initialSummary.promoCode });
      setPricing(next);
    });
  }

  function handleAddressChange(next: AddressValue) {
    const prefectureChanged = next.prefecture !== address.prefecture;
    setAddress(next);
    if (prefectureChanged && next.prefecture) reprice(next.prefecture);
  }

  async function finalizeOrder(paymentMethod: "test" | "stripe", paymentIntentId?: string) {
    const res = await placeOrderAction({
      email,
      fullName: address.fullName,
      fullNameKana: address.fullNameKana,
      phone: address.phone,
      postalCode: address.postalCode,
      prefecture: address.prefecture,
      city: address.city,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      deliveryDate: date,
      deliverySlot: slot,
      giftNote,
      paymentMethod,
      paymentIntentId,
      promoCode: initialSummary.promoCode,
      saveAddress,
    });
    if (!res.ok) {
      setOrderError(res.error);
      toast.error(res.error);
      return;
    }
    router.push(`/checkout/success?order=${res.orderNumber}`);
  }

  function handleTestPayment() {
    if (!validate()) return;
    startTransition(() => finalizeOrder("test"));
  }

  function validate() {
    if (!email || !address.fullName || !address.phone || !address.postalCode || !address.prefecture || !address.city || !address.addressLine1) {
      toast.error(t("fillRequiredFields"));
      return false;
    }
    return true;
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-8">
        <Section title={t("contactInfo")}>
          <Label htmlFor="checkout-email">{t("email")}</Label>
          <Input id="checkout-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Section>

        <Section title={t("shippingAddress")}>
          {savedAddresses.length > 0 && (
            <div className="mb-4">
              <Select value={selectedAddressId} onValueChange={pickSavedAddress}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.fullName}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">{t("newAddress")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <AddressFields value={address} onChange={handleAddressChange} />
          {userEmail && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Checkbox checked={saveAddress} onCheckedChange={(v) => setSaveAddress(!!v)} />
              {t("saveThisAddress")}
            </label>
          )}
        </Section>

        <Section title={t("deliveryDetails")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={date} onValueChange={setDate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {new Date(d).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_SLOTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {locale === "ja" ? s.labelJa : s.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title={t("payment")}>
          {stripeEnabled ? (
            <StripePaymentSection
              amount={pricing.totalJpy}
              disabled={pending}
              onPaid={(id) => {
                if (!validate()) return;
                startTransition(() => finalizeOrder("stripe", id));
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4">
              <p className="text-sm text-foreground-muted">{t("stripeNotConfigured")}</p>
              <Button size="lg" onClick={handleTestPayment} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("placeTestOrder", { amount: formatJpy(pricing.totalJpy) })}
              </Button>
            </div>
          )}
          {orderError && <p className="mt-2 text-sm text-sale">{orderError}</p>}
        </Section>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardContent className="flex flex-col gap-4 pt-6">
            <ul className="flex flex-col gap-3">
              {initialSummary.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                    {item.image && <Image src={item.image} alt={item.nameEn} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{locale === "ja" ? item.nameJa : item.nameEn}</p>
                    <p className="text-foreground-muted">
                      {locale === "ja" ? item.labelJa : item.labelEn} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{formatJpy(item.lineTotalJpy)}</p>
                </li>
              ))}
            </ul>
            <Separator />
            <Row label={t("subtotal")} value={formatJpy(pricing.subtotalJpy)} />
            {pricing.discountJpy > 0 && <Row label={t("discount")} value={`−${formatJpy(pricing.discountJpy)}`} />}
            <Row label={t("shippingEstimate")} value={pricing.shippingJpy === 0 ? t("free") : formatJpy(pricing.shippingJpy)} />
            <Row label={t("taxIncludedShort")} value={formatJpy(pricing.taxJpy)} muted />
            <Separator />
            <Row label={t("total")} value={formatJpy(pricing.totalJpy)} bold />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-xl">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${muted ? "text-foreground-muted" : ""} ${bold ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
