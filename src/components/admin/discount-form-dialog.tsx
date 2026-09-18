"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveDiscountAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";
import type { discounts } from "@/db/schema";

type Discount = typeof discounts.$inferSelect;

export function DiscountFormDialog({ discount }: { discount?: Discount }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [value, setValue] = useState({
    code: discount?.code ?? "",
    kind: (discount?.kind as "percent" | "fixed" | "free-shipping") ?? "percent",
    value: discount?.value ?? 10,
    minSpendJpy: discount?.minSpendJpy ?? 0,
    usageLimit: discount?.usageLimit ?? undefined,
    usageLimitPerCustomer: discount?.usageLimitPerCustomer ?? undefined,
    active: discount?.active ?? true,
  });

  function submit() {
    startTransition(async () => {
      await saveDiscountAction({ id: discount?.id, ...value });
      toast.success("Discount saved.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={discount ? "ghost" : "primary"} size="sm">
          {discount ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {discount ? "Edit" : "New discount"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{discount ? "Edit discount" : "New discount"}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label>Code</Label><Input className="mt-1 uppercase" value={value.code} onChange={(e) => setValue((p) => ({ ...p, code: e.target.value.toUpperCase() }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kind</Label>
              <Select value={value.kind} onValueChange={(v) => setValue((p) => ({ ...p, kind: v as typeof value.kind }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                  <SelectItem value="free-shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{value.kind === "percent" ? "Percent (0-100)" : "Amount (¥)"}</Label>
              <Input type="number" className="mt-1" value={value.value} onChange={(e) => setValue((p) => ({ ...p, value: Number(e.target.value) }))} disabled={value.kind === "free-shipping"} />
            </div>
          </div>
          <div><Label>Minimum spend (¥)</Label><Input type="number" className="mt-1" value={value.minSpendJpy} onChange={(e) => setValue((p) => ({ ...p, minSpendJpy: Number(e.target.value) }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Total usage limit</Label><Input type="number" className="mt-1" value={value.usageLimit ?? ""} onChange={(e) => setValue((p) => ({ ...p, usageLimit: e.target.value ? Number(e.target.value) : undefined }))} /></div>
            <div><Label>Per-customer limit</Label><Input type="number" className="mt-1" value={value.usageLimitPerCustomer ?? ""} onChange={(e) => setValue((p) => ({ ...p, usageLimitPerCustomer: e.target.value ? Number(e.target.value) : undefined }))} /></div>
          </div>
          <label className="flex items-center justify-between text-sm">
            Active
            <Switch checked={value.active} onCheckedChange={(v) => setValue((p) => ({ ...p, active: v }))} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
