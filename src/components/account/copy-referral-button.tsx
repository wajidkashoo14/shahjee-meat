"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyReferralButton({ code }: { code: string }) {
  const t = useTranslations("account.rewards");
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(code);
        toast.success(t("codeCopied"));
      }}
    >
      <Copy className="size-4" /> {t("copyCode")}
    </Button>
  );
}
