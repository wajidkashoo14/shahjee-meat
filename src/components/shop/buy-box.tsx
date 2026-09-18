"use client";
import { useMemo, useState, useTransition } from "react";
import { Heart, Minus, Plus, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/shop/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatJpy, formatPer100g } from "@/lib/utils";
import { toggleWishlistAction, subscribeStockAlertAction } from "@/server/actions/engagement-actions";
import { authClient } from "@/lib/auth-client";
import type { products, productVariants } from "@/db/schema";

type Product = typeof products.$inferSelect;
type Variant = typeof productVariants.$inferSelect;

export function BuyBox({ product, variants, initiallyWishlisted }: { product: Product; variants: Variant[]; initiallyWishlisted: boolean }) {
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("product");
  const { data: session } = authClient.useSession();

  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstInStock?.id);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [alertEmail, setAlertEmail] = useState(session?.user?.email ?? "");
  const [alertSent, setAlertSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => variants.find((v) => v.id === selectedId) ?? variants[0], [variants, selectedId]);
  const soldOut = !selected || selected.stock === 0;

  function handleWishlist() {
    startTransition(async () => {
      const res = await toggleWishlistAction(product.id);
      if (res.requiresAuth) {
        toast.error(t("signInToSave"));
        return;
      }
      setWishlisted(res.active);
      toast.success(res.active ? t("savedToWishlist") : t("removedFromWishlist"));
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.nameEn, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("linkCopied"));
    }
  }

  function handleNotify() {
    if (!selected) return;
    startTransition(async () => {
      await subscribeStockAlertAction({ variantId: selected.id, productId: product.id, email: alertEmail });
      setAlertSent(true);
      toast.success(t("notifyConfirmed"));
    });
  }

  const name = locale === "ja" ? product.nameJa : product.nameEn;
  const subtitle = locale === "ja" ? product.subtitleJa : product.subtitleEn;

  return (
    <div className="flex flex-col gap-5">
      <div>
        {product.grade === "wagyu" && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brass">Wagyu</p>}
        <h1 className="font-display text-3xl sm:text-4xl">{name}</h1>
        {subtitle && <p className="mt-1 text-foreground-muted">{subtitle}</p>}
        {product.ratingCount > 0 && (
          <div className="mt-2">
            <StarRating rating={product.ratingAvg} count={product.ratingCount} size="md" />
          </div>
        )}
      </div>

      {selected && (
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">{formatJpy(selected.priceJpy)}</span>
          {selected.compareAtPriceJpy && (
            <span className="text-base text-foreground-muted line-through tabular-nums">{formatJpy(selected.compareAtPriceJpy)}</span>
          )}
          <span className="text-sm text-foreground-muted">{formatPer100g(selected.priceJpy, selected.weightGrams)}</span>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">{t("size")}</p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              disabled={v.stock === 0}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selectedId === v.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/60"
              }`}
            >
              {locale === "ja" ? v.labelJa : v.labelEn}
              {v.stock === 0 && <span className="ml-1 text-xs">({t("soldOut")})</span>}
            </button>
          ))}
        </div>
      </div>

      {!soldOut ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center tabular-nums">{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(selected!.stock, q + 1))} aria-label="Increase quantity">
              <Plus className="size-4" />
            </button>
          </div>
          <AddToCartButton variantId={selected!.id} quantity={quantity} size="lg" className="flex-1" />
        </div>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-sm font-medium">{t("notifyWhenBack")}</p>
          {alertSent ? (
            <p className="text-sm text-success">{t("notifyConfirmed")}</p>
          ) : (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
              />
              <Button onClick={handleNotify} disabled={pending || !alertEmail}>
                {t("notifyMe")}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleWishlist} disabled={pending}>
          <Heart className={wishlisted ? "size-4 fill-sale text-sale" : "size-4"} /> {wishlisted ? t("saved") : t("addToWishlist")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="size-4" /> {t("share")}
        </Button>
      </div>
    </div>
  );
}
