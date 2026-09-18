"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatusAction } from "@/server/actions/admin-actions";

const STATUSES = ["paid", "packing", "shipped", "delivered", "cancelled", "refunded"];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      value={status}
      onValueChange={(v) =>
        startTransition(async () => {
          await updateOrderStatusAction(orderId, v);
          toast.success(`Status updated to ${v}.`);
          router.refresh();
        })
      }
      disabled={pending}
    >
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
