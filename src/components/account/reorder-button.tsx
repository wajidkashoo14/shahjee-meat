"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { RotateCw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { reorderAction } from "@/server/actions/account-actions";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { getCartSummaryAction } from "@/server/actions/cart-actions";

export function ReorderButton({ orderId, ...props }: { orderId: string } & Omit<ButtonProps, "onClick">) {
  const [pending, startTransition] = useTransition();
  const setSummary = useCartStore((s) => s.setSummary);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const t = useTranslations("account.orders");

  return (
    <Button
      variant="primary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await reorderAction(orderId);
          setSummary(await getCartSummaryAction());
          setCartOpen(true);
          toast.success(t("reorderedSuccess"));
        })
      }
      {...props}
    >
      <RotateCw className="size-4" /> {t("reorder")}
    </Button>
  );
}
