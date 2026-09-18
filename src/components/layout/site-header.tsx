import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { HeaderClient } from "@/components/layout/header-client";

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <HeaderClient isSignedIn={!!session?.user} role={(session?.user as { role?: string })?.role} />;
}
