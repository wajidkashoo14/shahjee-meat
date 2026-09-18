"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { exportMyDataAction, deleteMyAccountAction } from "@/server/actions/account-actions";
import { authClient } from "@/lib/auth-client";

export function DangerZone() {
  const t = useTranslations("account.settings");
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const res = await exportMyDataAction();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "whole-cuts-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteMyAccountAction();
      await authClient.signOut();
      toast.success("Account deleted.");
      // A full reload (not router.push) is intentional: it guarantees every
      // in-memory store (cart, session) is thrown away after the account
      // and its session are destroyed server-side.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{t("exportData")}</p>
          <p className="text-sm text-foreground-muted">{t("exportDesc")}</p>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={pending}>
          <Download className="size-4" /> {t("exportData")}
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sale">{t("deleteAccount")}</p>
          <p className="text-sm text-foreground-muted">{t("deleteAccountDesc")}</p>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={pending}>
          <Trash2 className="size-4" /> {t("deleteAccount")}
        </Button>
      </div>
    </div>
  );
}
