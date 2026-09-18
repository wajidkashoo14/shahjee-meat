"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setCustomerRoleAction, banCustomerAction, adjustPointsAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";

export function CustomerActions({ userId, role, banned }: { userId: string; role: string; banned: boolean }) {
  const [pending, startTransition] = useTransition();
  const [points, setPoints] = useState(100);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground-muted">Role</span>
        <Select
          value={role}
          onValueChange={(v) =>
            startTransition(async () => {
              await setCustomerRoleAction(userId, v as "customer" | "staff" | "admin");
              toast.success(`Role set to ${v}.`);
              router.refresh();
            })
          }
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={banned ? "secondary" : "outline"}
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await banCustomerAction(userId, !banned);
              toast.success(banned ? "Customer unbanned." : "Customer banned.");
              router.refresh();
            })
          }
        >
          {banned ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
          {banned ? "Unban" : "Ban"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input type="number" className="w-32" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await adjustPointsAction(userId, points, "manual-adjustment");
              toast.success(`${points > 0 ? "Added" : "Removed"} ${Math.abs(points)} points.`);
              router.refresh();
            })
          }
        >
          <Plus className="size-4" /> Adjust points
        </Button>
      </div>
    </div>
  );
}
