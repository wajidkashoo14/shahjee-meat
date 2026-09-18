import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Throws if the current user isn't staff or admin — use inside Server Actions. */
export async function requireStaffOrAdmin() {
  const user = await getSessionUser();
  const role = (user as { role?: string } | null)?.role;
  if (!user || (role !== "admin" && role !== "staff")) throw new Error("Forbidden");
  return user as typeof user & { role: string };
}

/** Throws if the current user isn't an admin — use for admin-only mutations (discounts, settings, users). */
export async function requireAdmin() {
  const user = await getSessionUser();
  const role = (user as { role?: string } | null)?.role;
  if (!user || role !== "admin") throw new Error("Forbidden");
  return user as typeof user & { role: string };
}
