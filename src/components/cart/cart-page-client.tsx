"use client";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Trash2, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  updateCartItemAction,
  removeCartItemAction,
  applyPromoCodeAction,
  setDeliveryAction,
  setGiftNoteAction,
} from "@/server/actions/cart-actions";
import { useCartStore } from "@/store/cart-store";
import type { CartSummary } from "@/server/cart";
import { formatJpy } from "@/lib/utils";
import { DELIVERY_SLOTS, FREE_SHIPPING_THRESHOLD_JPY } from "@/lib/shipping";
import { nextAvailableDeliveryDates } from "@/lib/delivery";

export function CartPageClient({ initialSummary }: { initialSummary: CartSummary }) {
  const summary = useCartStore((s) => s.summary) ?? initialSummary;
  const setSummary = useCartStore((s) => s.setSummary);
  const [pending, startTransition] = useTransition();
  const [promo, setPromo] = useState(summary.promoCode ?? "");
  const [giftNote, setGiftNote] = useState(summary.giftNote);
  const t = useTranslations("cart");
  const locale = useLocale() as "en" | "ja";

  const dates = useMemo(() => nextAvailableDeliveryDates(14), []);
  const [date, setDate] = useState(summary.deliveryDate || dates[0]);
  const [slot, setSlot] = useState(summary.deliverySlot || DELIVERY_SLOTS[0].id);

  function updateQty(itemId: string, quantity: number) {
    startTransition(async () => setSummary(await updateCartItemAction({ itemId, quantity })));
  }
  function remove(itemId: string) {
    startTransition(async () => setSummary(await removeCartItemAction(itemId)));
  }
  function applyPromo() {
    startTransition(async () => {
      const next = await applyPromoCodeAction(promo);
      setSummary(next);
      if (next.pricing.discountError) toast.error(next.pricing.discountError);
      else if (promo) toast.success(t("promoApplied"));
    });
  }
  function saveDelivery(nextDate: string, nextSlot: string) {
    setDate(nextDate);
    setSlot(nextSlot);
    startTransition(async () => setSummary(await setDeliveryAction({ date: nextDate, slot: nextSlot })));
  }
  function saveGiftNote() {
    startTransition(async () => setSummary(await setGiftNoteAction(giftNote)));
  }

  if (summary.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-foreground-muted">{t("empty")}</p>
        <Button asChild>
          <Link href="/collections">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_JPY - summary.pricing.subtotalJpy);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (summary.pricing.subtotalJpy / FREE_SHIPPING_THRESHOLD_JPY) * 100)}%` }}
          />
        </div>
        <p className="text-sm text-foreground-muted">
          {remaining > 0 ? t("freeShippingRemaining", { amount: formatJpy(remaining) }) : t("freeShippingUnlocked")}
        </p>

        <ul className="flex flex-col divide-y divide-border">
          {summary.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-raised">
                {item.image && <Image src={item.image} alt={item.nameEn} fill sizes="96px" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{locale === "ja" ? item.nameJa : item.nameEn}</p>
                    <p className="text-sm text-foreground-muted">{locale === "ja" ? item.labelJa : item.labelEn}</p>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-foreground-muted hover:text-sale" aria-label="Remove">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-border">
                    <button disabled={pending} onClick={() => updateQty(item.id, item.quantity - 1)} className="p-2 disabled:opacity-40">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      disabled={pending || item.quantity >= item.stock}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="p-2 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold tabular-nums">{formatJpy(item.lineTotalJpy)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="flex items-center gap-2 font-medium">
              <Truck className="size-4 text-primary" /> {t("deliveryDetails")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select value={date} onValueChange={(v) => saveDelivery(v, slot)}>
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
              <Select value={slot} onValueChange={(v) => saveDelivery(date, v)}>
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

            <div>
              <label className="text-sm font-medium">{t("giftNote")}</label>
              <Textarea
                className="mt-1"
                rows={2}
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                onBlur={saveGiftNote}
                placeholder={t("giftNotePlaceholder")}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex gap-2">
              <Input placeholder={t("promoCode")} value={promo} onChange={(e) => setPromo(e.target.value)} />
              <Button variant="secondary" onClick={applyPromo} disabled={pending}>
                <Tag className="size-4" />
              </Button>
            </div>

            <Separator />

            <Row label={t("subtotal")} value={formatJpy(summary.pricing.subtotalJpy)} />
            {summary.pricing.discountJpy > 0 && <Row label={t("discount")} value={`−${formatJpy(summary.pricing.discountJpy)}`} muted />}
            <Row label={t("shippingEstimate")} value={summary.pricing.shippingJpy === 0 ? t("free") : formatJpy(summary.pricing.shippingJpy)} />
            <Row label={t("taxIncluded", { amount: formatJpy(summary.pricing.taxJpy) })} value="" muted />
            <Separator />
            <Row label={t("total")} value={formatJpy(summary.pricing.totalJpy)} bold />

            <Button size="lg" className="w-full" asChild>
              <Link href="/checkout">{t("checkout")}</Link>
            </Button>
            <Link href="/collections" className="text-center text-sm text-foreground-muted hover:text-foreground">
              {t("continueShopping")}
            </Link>
          </CardContent>
        </Card>
      </div>
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
