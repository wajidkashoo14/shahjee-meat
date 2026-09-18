"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/server/actions/account-actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("account.orders");
  const router = useRouter();

  function handleCancel() {
    if (!window.confirm(t("cancelConfirm"))) return;
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (res.ok) {
        toast.success(t("cancelledSuccess"));
        router.refresh();
      } else {
        toast.error(t("cancelWindowClosed"));
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCancel} disabled={pending}>
      {t("cancelOrder")}
    </Button>
  );
}
