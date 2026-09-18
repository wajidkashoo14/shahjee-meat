"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Boxes } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustInventoryAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";

export function InventoryAdjustDialog({ variantId, label }: { variantId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (change === 0) return;
    startTransition(async () => {
      await adjustInventoryAction({ variantId, change, reason, note });
      toast.success("Stock updated.");
      setOpen(false);
      setChange(0);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Boxes className="size-4" /> Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust stock — {label}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Change (use negative to remove)</Label>
            <Input type="number" className="mt-1" value={change} onChange={(e) => setChange(Number(e.target.value))} />
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restock">Restock</SelectItem>
                <SelectItem value="manual-adjustment">Manual adjustment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
