"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { deleteDiscountAction } from "@/server/actions/admin-actions";

export function DeleteDiscountButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this discount code?")) return;
        startTransition(async () => {
          await deleteDiscountAction(id);
          toast.success("Discount deleted.");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4 text-sale" />
    </Button>
  );
}
