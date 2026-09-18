import { listCollectionsAdmin } from "@/server/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CollectionFormDialog } from "@/components/admin/collection-form-dialog";
import { DeleteCollectionButton } from "@/components/admin/delete-collection-button";

export default async function AdminCollectionsPage() {
  const collections = await listCollectionsAdmin();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CollectionFormDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <p className="font-medium">{c.titleEn}</p>
                <p className="text-xs text-foreground-muted">{c.titleJa}</p>
              </TableCell>
              <TableCell><Badge variant="outline">{c.kind}{c.ruleTag ? `: ${c.ruleTag}` : ""}</Badge></TableCell>
              <TableCell className="text-foreground-muted">/{c.slug}</TableCell>
              <TableCell className="flex gap-2">
                <CollectionFormDialog collection={c} />
                <DeleteCollectionButton id={c.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
