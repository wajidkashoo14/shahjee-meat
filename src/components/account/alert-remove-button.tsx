"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { removeStockAlertAction } from "@/server/actions/account-actions";

export function AlertRemoveButton({ alertId }: { alertId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("account.alerts");

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await removeStockAlertAction(alertId); router.refresh(); })}
      className="rounded-full border border-border p-2 text-foreground-muted hover:text-sale"
      aria-label={t("remove")}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
