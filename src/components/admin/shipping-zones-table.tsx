"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { saveShippingZoneAction } from "@/server/actions/admin-actions";
import type { shippingZones } from "@/db/schema";

type Zone = typeof shippingZones.$inferSelect;

export function ShippingZonesTable({ zones }: { zones: Zone[] }) {
  const [pending, startTransition] = useTransition();

  function save(zone: Zone, patch: Partial<Zone>) {
    startTransition(async () => {
      await saveShippingZoneAction({ id: zone.id, baseFeeJpy: patch.baseFeeJpy ?? zone.baseFeeJpy, surchargeJpy: patch.surchargeJpy ?? zone.surchargeJpy });
      toast.success(`${zone.prefecture} updated.`);
    });
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prefecture</TableHead>
            <TableHead>Base fee (¥)</TableHead>
            <TableHead>Remote surcharge (¥)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map((z) => (
            <TableRow key={z.id}>
              <TableCell>{z.prefecture}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  disabled={pending}
                  defaultValue={z.baseFeeJpy}
                  className="h-8 w-28"
                  onBlur={(e) => save(z, { baseFeeJpy: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  disabled={pending}
                  defaultValue={z.surchargeJpy}
                  className="h-8 w-28"
                  onBlur={(e) => save(z, { surchargeJpy: Number(e.target.value) })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
