"use client";
import Image from "next/image";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { removeWishlistItemAction } from "@/server/actions/account-actions";
import { useRouter } from "@/i18n/navigation";
import { formatJpy } from "@/lib/utils";
import type { products, productVariants, productImages } from "@/db/schema";

type Item = {
  wishlistId: string;
  product: (typeof products.$inferSelect & { variants: (typeof productVariants.$inferSelect)[]; images: (typeof productImages.$inferSelect)[] }) | undefined;
};

export function WishlistGrid({ items }: { items: Item[] }) {
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("account.wishlist");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(({ wishlistId, product }) => {
        if (!product) return null;
        const variant = product.variants[0];
        return (
          <Card key={wishlistId} className="overflow-hidden">
            <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-surface-raised">
              {product.images[0] && <Image src={product.images[0].url} alt={product.nameEn} fill sizes="200px" className="object-cover" />}
            </Link>
            <div className="p-3">
              <Link href={`/products/${product.slug}`} className="text-sm font-medium hover:text-primary">
                {locale === "ja" ? product.nameJa : product.nameEn}
              </Link>
              {variant && <p className="mt-1 text-sm font-semibold tabular-nums">{formatJpy(variant.priceJpy)}</p>}
              <div className="mt-2 flex items-center gap-2">
                {variant && <AddToCartButton variantId={variant.id} size="sm" variant="secondary" openCartOnAdd={false} label="" />}
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => { await removeWishlistItemAction(wishlistId); router.refresh(); })}
                  className="rounded-full border border-border p-2 text-foreground-muted hover:text-sale"
                  aria-label={t("remove")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
