"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { refundOrderAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";

export function RefundDialog({ orderId, maxAmount }: { orderId: string; maxAmount: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(maxAmount);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (amount <= 0 || amount > maxAmount) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    startTransition(async () => {
      await refundOrderAction({ orderId, amountJpy: amount, reason });
      toast.success("Refund processed.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Undo2 className="size-4" /> Refund</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue a refund</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Amount (¥, max {maxAmount.toLocaleString()})</Label>
            <Input type="number" className="mt-1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} max={maxAmount} />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea className="mt-1" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={pending}>Refund</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
