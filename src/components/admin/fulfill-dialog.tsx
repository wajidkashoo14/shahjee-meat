"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fulfillOrderAction } from "@/server/actions/admin-actions";
import { useRouter } from "@/i18n/navigation";

export function FulfillDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState<"yamato" | "sagawa">("yamato");
  const [tracking, setTracking] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!tracking) {
      toast.error("Enter a tracking number.");
      return;
    }
    startTransition(async () => {
      await fulfillOrderAction({ orderId, carrier, trackingNumber: tracking });
      toast.success("Order marked as shipped and customer notified.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Truck className="size-4" /> Fulfill</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark as shipped</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Carrier</Label>
            <Select value={carrier} onValueChange={(v) => setCarrier(v as "yamato" | "sagawa")}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yamato">Yamato Transport</SelectItem>
                <SelectItem value="sagawa">Sagawa Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tracking number</Label>
            <Input className="mt-1" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>Mark shipped &amp; notify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
