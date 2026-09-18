import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCustomersAdmin } from "@/server/admin";

export default async function AdminCustomersPage() {
  const customers = await listCustomersAdmin();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell className="text-foreground-muted">{c.email}</TableCell>
            <TableCell>
              <Badge variant={c.role === "admin" ? "premium" : c.role === "staff" ? "new" : "outline"}>{c.role}</Badge>
              {c.banned && <Badge variant="sale" className="ml-1">banned</Badge>}
            </TableCell>
            <TableCell>{c.pointsBalance}</TableCell>
            <TableCell className="text-foreground-muted">{c.createdAt.toLocaleDateString()}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/customers/${c.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
