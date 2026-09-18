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
  const primaryVariant = variants[0];

  const name = locale === "ja" ? product.nameJa : product.nameEn;
  const secondaryImage = images[1]?.url ?? images[0]?.url;

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-raised">
          {images[0] && (
            <Image
              src={hovered && secondaryImage ? secondaryImage : images[0].url}
              alt={images[0].alt || name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {soldOut && <Badge variant="soldout">{t("soldOut")}</Badge>}
            {!soldOut && onSale && <Badge variant="sale">{t("sale")}</Badge>}
            {!soldOut && product.isNewArrival && <Badge variant="new">{t("new")}</Badge>}
            {product.grade === "wagyu" && <Badge variant="premium">Wagyu</Badge>}
          </div>
          <button
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-sale"
            aria-label={t("addToWishlist")}
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="size-4" />
          </button>
        </div>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        {product.ratingCount > 0 && <StarRating rating={product.ratingAvg} count={product.ratingCount} />}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug hover:text-primary">{name}</h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tabular-nums">
            {hasRange && t("from")} {formatJpy(minPrice)}
          </span>
          {compareAtPrice && <span className="text-xs text-foreground-muted line-through tabular-nums">{formatJpy(compareAtPrice)}</span>}
        </div>
        {primaryVariant && <p className="text-xs text-foreground-muted">{formatPer100g(primaryVariant.priceJpy, primaryVariant.weightGrams)}</p>}
      </div>

      {!soldOut && primaryVariant && (
        <AddToCartButton
          variantId={primaryVariant.id}
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          openCartOnAdd={false}
        />
      )}
      {soldOut && (
        <Link
          href={`/products/${product.slug}`}
          className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-border text-xs font-medium text-foreground-muted hover:border-primary hover:text-primary"
        >
          {t("notifyMe")}
        </Link>
      )}
    </div>
  );
}
