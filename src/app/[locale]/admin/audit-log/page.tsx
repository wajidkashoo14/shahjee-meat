import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAuditLogAdmin } from "@/server/admin";

export default async function AdminAuditLogPage() {
  const logs = await listAuditLogAdmin(200);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="whitespace-nowrap text-xs text-foreground-muted">{log.createdAt.toLocaleString()}</TableCell>
            <TableCell>{log.actorName}</TableCell>
            <TableCell className="font-mono text-xs">{log.action}</TableCell>
            <TableCell className="text-xs text-foreground-muted">{log.targetType} {log.targetId ? `#${log.targetId.slice(0, 8)}` : ""}</TableCell>
            <TableCell className="text-xs text-foreground-muted">{log.detail}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
