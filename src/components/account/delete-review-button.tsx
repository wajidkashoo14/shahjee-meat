"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { deleteMyReviewAction } from "@/server/actions/account-actions";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("account.reviews");

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteMyReviewAction(reviewId); router.refresh(); })}
    >
      <Trash2 className="size-4 text-sale" /> {t("delete")}
    </Button>
  );
}
