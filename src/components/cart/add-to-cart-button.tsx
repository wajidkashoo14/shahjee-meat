"use client";
import { useState, useTransition } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { addToCartAction } from "@/server/actions/cart-actions";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { useTranslations } from "next-intl";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  label,
  openCartOnAdd = true,
  ...props
}: { variantId: string; quantity?: number; disabled?: boolean; label?: string; openCartOnAdd?: boolean } & Omit<
  ButtonProps,
  "onClick"
>) {
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const setSummary = useCartStore((s) => s.setSummary);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const t = useTranslations("cart");

  function handleClick() {
    startTransition(async () => {
      try {
        const summary = await addToCartAction({ variantId, quantity });
        setSummary(summary);
        setJustAdded(true);
        toast.success(t("addedToCart"));
        if (openCartOnAdd) setCartOpen(true);
        setTimeout(() => setJustAdded(false), 1500);
      } catch {
        toast.error(t("addToCartError"));
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={disabled || pending} {...props}>
      {justAdded ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
      {label ?? t("addToCart")}
    </Button>
  );
}
