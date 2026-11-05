"use client";
import Image from "next/image";
import { useTransition } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { updateCartItemAction, removeCartItemAction } from "@/server/actions/cart-actions";
import { formatJpy } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_JPY } from "@/lib/shipping";

export function CartSheet() {
  const cartOpen = useUIStore((s) => s.cartOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const summary = useCartStore((s) => s.summary);
  const setSummary = useCartStore((s) => s.setSummary);
  const [pending, startTransition] = useTransition();
  const t = useTranslations("cart");

  const subtotal = summary?.pricing.subtotalJpy ?? 0;
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_JPY) * 100));
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_JPY - subtotal);

  function updateQty(itemId: string, quantity: number) {
    startTransition(async () => {
      const next = await updateCartItemAction({ itemId, quantity });
      setSummary(next);
    });
  }

  function remove(itemId: string) {
    startTransition(async () => {
      const next = await removeCartItemAction(itemId);
      setSummary(next);
    });
  }

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" /> {t("yourCart")}
          </SheetTitle>
        </SheetHeader>

        {/* Free shipping thermometer */}
        <div className="px-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            {remaining > 0 ? t("freeShippingRemaining", { amount: formatJpy(remaining) }) : t("freeShippingUnlocked")}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {!summary || summary.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="size-10 text-foreground-muted" />
              <p className="text-foreground-muted">{t("empty")}</p>
              <Button variant="secondary" onClick={() => setCartOpen(false)} asChild>
                <Link href="/collections">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-5 py-4">
              {summary.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-raised">
                    {item.image && <Image src={item.image} alt={item.nameEn} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{item.nameEn}</p>
                      <button onClick={() => remove(item.id)} className="text-foreground-muted hover:text-sale" aria-label="Remove">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-foreground-muted">{item.labelEn}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-border">
                        <button
                          disabled={pending}
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="p-1.5 disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          disabled={pending || item.quantity >= item.stock}
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="p-1.5 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatJpy(item.lineTotalJpy)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {summary && summary.items.length > 0 && (
          <SheetFooter className="gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">{t("subtotal")}</span>
              <span className="font-semibold tabular-nums">{formatJpy(subtotal)}</span>
            </div>
            <p className="text-xs text-foreground-muted">{t("taxShippingNote")}</p>
            <Separator />
            <Button size="lg" className="w-full" asChild onClick={() => setCartOpen(false)}>
              <Link href="/checkout">{t("checkout")}</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild onClick={() => setCartOpen(false)}>
              <Link href="/cart">{t("viewCart")}</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
