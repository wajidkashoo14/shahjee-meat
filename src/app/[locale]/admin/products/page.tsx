import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listProductsAdmin } from "@/server/admin";
import { formatJpy } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await listProductsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" /> New product
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
            const minPrice = p.variants.length ? Math.min(...p.variants.map((v) => v.priceJpy)) : 0;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.nameEn}</p>
                  <p className="text-xs text-foreground-muted">{p.nameJa}</p>
                </TableCell>
                <TableCell className="capitalize">{p.category}</TableCell>
                <TableCell className="tabular-nums">{formatJpy(minPrice)}</TableCell>
                <TableCell className={totalStock === 0 ? "text-sale" : totalStock < 10 ? "text-brass" : ""}>{totalStock}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "new" : "outline"}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/products/${p.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
