"use client";
import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { StarRating } from "@/components/shop/star-rating";
import { formatJpy, formatPer100g } from "@/lib/utils";
import type { products } from "@/db/schema";

export type ProductCardData = {
  product: typeof products.$inferSelect;
  variants: Array<{ id: string; priceJpy: number; compareAtPriceJpy: number | null; weightGrams: number; stock: number }>;
  images: Array<{ url: string; alt: string }>;
  minPrice: number;
  hasRange: boolean;
  onSale: boolean;
  compareAtPrice?: number;
  soldOut: boolean;
};

export function ProductCard({ data }: { data: ProductCardData }) {
  const { product, variants, images, minPrice, hasRange, onSale, compareAtPrice, soldOut } = data;
  const [hovered, setHovered] = useState(false);
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("shop");
  const tc = useTranslations("cart");
  const primaryVariant = variants[0];

  const name = locale === "ja" ? product.nameJa : product.nameEn;
  const secondaryImage = images[1]?.url ?? images[0]?.url;

  const kicker = [product.origin, product.cut].filter(Boolean).join(" · ");

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
          {images[0] && (
            <Image
              src={hovered && secondaryImage ? secondaryImage : images[0].url}
              alt={images[0].alt || name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-charcoal/35 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut && <Badge variant="soldout">{t("soldOut")}</Badge>}
            {!soldOut && onSale && <Badge variant="sale">{t("sale")}</Badge>}
            {!soldOut && product.isNewArrival && <Badge variant="new">{t("new")}</Badge>}
            {product.grade === "wagyu" && <Badge variant="premium">Wagyu</Badge>}
          </div>
        </div>
      </Link>
      <button
        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm backdrop-blur transition-all hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={t("addToWishlist")}
        onClick={(e) => e.preventDefault()}
      >
        <Heart className="size-4" />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-5">
        {kicker && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted sm:text-xs">{kicker}</p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-display text-base leading-snug transition-colors hover:text-primary sm:text-lg">{name}</h3>
        </Link>
        {product.ratingCount > 0 && <StarRating rating={product.ratingAvg} count={product.ratingCount} />}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-bold tabular-nums text-primary sm:text-lg">
                {hasRange && <span className="mr-1 text-xs font-medium text-foreground-muted">{t("from")}</span>}
                {formatJpy(minPrice)}
              </span>
              {compareAtPrice && (
                <span className="text-xs text-foreground-muted line-through tabular-nums">{formatJpy(compareAtPrice)}</span>
              )}
            </div>
            {primaryVariant && (
              <p className="truncate text-xs text-foreground-muted">{formatPer100g(primaryVariant.priceJpy, primaryVariant.weightGrams)}</p>
            )}
          </div>

          {!soldOut && primaryVariant && (
            <AddToCartButton
              variantId={primaryVariant.id}
              size="icon"
              label=""
              aria-label={tc("addToCart")}
              className="shrink-0"
              openCartOnAdd={false}
            />
          )}
          {soldOut && (
            <Link
              href={`/products/${product.slug}`}
              className="min-w-0 max-w-[55%] truncate rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition-colors hover:border-primary hover:text-primary"
            >
              {t("notifyMe")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
