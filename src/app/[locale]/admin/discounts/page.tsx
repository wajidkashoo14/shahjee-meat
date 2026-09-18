import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listDiscountsAdmin } from "@/server/admin";
import { DiscountFormDialog } from "@/components/admin/discount-form-dialog";
import { DeleteDiscountButton } from "@/components/admin/delete-discount-button";
import { formatJpy } from "@/lib/utils";

export default async function AdminDiscountsPage() {
  const list = await listDiscountsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><DiscountFormDialog /></div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Min. spend</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono font-medium">{d.code}</TableCell>
              <TableCell className="capitalize">{d.kind.replace("-", " ")}</TableCell>
              <TableCell>{d.kind === "percent" ? `${d.value}%` : d.kind === "fixed" ? formatJpy(d.value) : "—"}</TableCell>
              <TableCell>{formatJpy(d.minSpendJpy)}</TableCell>
              <TableCell>{d.timesUsed}{d.usageLimit ? ` / ${d.usageLimit}` : ""}</TableCell>
              <TableCell><Badge variant={d.active ? "new" : "outline"}>{d.active ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell className="flex gap-2">
                <DiscountFormDialog discount={d} />
                <DeleteDiscountButton id={d.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
