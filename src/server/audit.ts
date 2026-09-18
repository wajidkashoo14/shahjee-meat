import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { uuidv7 } from "@/lib/id";

export async function logAudit(opts: {
  actorId?: string | null;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}) {
  await db.insert(auditLogs).values({
    id: uuidv7(),
    actorId: opts.actorId ?? null,
    actorName: opts.actorName,
    action: opts.action,
    targetType: opts.targetType ?? "",
    targetId: opts.targetId ?? "",
    detail: opts.detail ?? "",
  });
}
