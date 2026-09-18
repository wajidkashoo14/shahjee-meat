import { db } from "@/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryAdjustDialog } from "@/components/admin/inventory-adjust-dialog";

export default async function AdminInventoryPage() {
  const variants = await db.query.productVariants.findMany({
    with: { product: true },
    orderBy: (v, { asc }) => [asc(v.stock)],
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Variant</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((v) => (
          <TableRow key={v.id}>
            <TableCell>{v.product.nameEn}</TableCell>
            <TableCell className="text-foreground-muted">{v.labelEn}</TableCell>
            <TableCell className="text-xs text-foreground-muted">{v.sku}</TableCell>
            <TableCell className={v.stock === 0 ? "text-sale font-medium" : v.stock < 5 ? "text-brass font-medium" : ""}>{v.stock}</TableCell>
            <TableCell>
              <InventoryAdjustDialog variantId={v.id} label={`${v.product.nameEn} — ${v.labelEn}`} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
