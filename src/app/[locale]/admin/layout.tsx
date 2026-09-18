import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/require-role";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { adminNav } from "@/lib/dashboard-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const role = (user as { role?: string } | null)?.role;
  if (!user) redirect("/sign-in?next=/admin");
  if (role !== "admin" && role !== "staff") redirect("/account");

  return (
    <DashboardShell
      navItems={adminNav.map((n) => ({
        href: n.href,
        label: n.label,
        icon: <n.icon className="size-4" />,
      }))}
      title="Admin"
      subtitle={`Signed in as ${user.name} (${role})`}
    >
      {children}
    </DashboardShell>
  );
}
