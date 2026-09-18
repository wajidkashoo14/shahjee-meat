import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listRecipesAdmin } from "@/server/admin";

export default async function AdminRecipesPage() {
  const recipes = await listRecipesAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild><Link href="/admin/recipes/new"><Plus className="size-4" /> New recipe</Link></Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{r.titleEn}</p>
                <p className="text-xs text-foreground-muted">{r.titleJa}</p>
              </TableCell>
              <TableCell className="capitalize">{r.category}</TableCell>
              <TableCell className="capitalize">{r.difficulty}</TableCell>
              <TableCell><Badge variant={r.status === "published" ? "new" : "outline"}>{r.status}</Badge></TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild><Link href={`/admin/recipes/${r.id}`}>Edit</Link></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
