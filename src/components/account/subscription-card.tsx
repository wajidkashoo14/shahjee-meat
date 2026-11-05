"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Pause, Play, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSubscriptionStatusAction } from "@/server/actions/account-actions";
import { formatJpy } from "@/lib/utils";

type Sub = {
  id: string;
  name: string;
  frequencyWeeks: number;
  status: string;
  nextDeliveryDate: string;
  totalJpy: number;
  items: Array<{ quantity: number; variant?: { labelEn: string; labelJa: string; product?: { nameEn: string; nameJa: string } } }>;
};

export function SubscriptionCard({ sub }: { sub: Sub }) {
  const t = useTranslations("account.subscriptions");
  const locale = useLocale() as "en" | "ja";
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(status: "active" | "paused" | "cancelled") {
    if (status === "cancelled" && !window.confirm(t("cancelConfirm"))) return;
    startTransition(async () => {
      await updateSubscriptionStatusAction(sub.id, status);
      toast.success(t(status));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-lg">{sub.name}</p>
            <p className="text-sm text-foreground-muted">{t("everyNWeeks", { n: sub.frequencyWeeks })}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${sub.status === "active" ? "bg-foreground/10 text-foreground" : sub.status === "paused" ? "bg-primary/20 text-accent" : "bg-foreground-muted/20 text-foreground-muted"}`}
          >
            {t(sub.status as "active" | "paused" | "cancelled")}
          </span>
        </div>

        <p className="mt-3 text-sm">
          {t("nextDelivery")}: <span className="font-medium">{sub.nextDeliveryDate}</span>
        </p>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-foreground-muted">{t("items")}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {sub.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {locale === "ja" ? item.variant?.product?.nameJa : item.variant?.product?.nameEn} ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-sm font-semibold tabular-nums">{formatJpy(sub.totalJpy)}</p>

        {sub.status !== "cancelled" && (
          <div className="mt-4 flex gap-2">
            {sub.status === "active" ? (
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("paused")}>
                <Pause className="size-4" /> {t("pause")}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("active")}>
                <Play className="size-4" /> {t("resume")}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("cancelled")}>
              <XCircle className="size-4" /> {t("cancel")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
