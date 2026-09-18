"use client";
import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { shopRecipeAction } from "@/server/actions/cart-actions";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";

export function ShopRecipeButton({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();
  const setSummary = useCartStore((s) => s.setSummary);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const t = useTranslations("recipes");

  return (
    <Button
      size="lg"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const summary = await shopRecipeAction(recipeId);
          setSummary(summary);
          setCartOpen(true);
          toast.success(t("shoppedRecipe"));
        })
      }
    >
      <ShoppingBag className="size-4" /> {t("shopThisRecipe")}
    </Button>
  );
}
