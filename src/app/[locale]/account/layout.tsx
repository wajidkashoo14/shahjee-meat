import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { accountNav } from "@/lib/dashboard-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account");

  const t = await getTranslations("account");

  return (
    <DashboardShell
      navItems={accountNav.map((n) => ({
        href: n.href,
        label: t(`nav.${n.key}` as never),
        icon: <n.icon className="size-4" />,
      }))}
      title={t("dashboard")}
      subtitle={t("welcomeBack", { name: session.user.name?.split(" ")[0] ?? "" })}
    >
      {children}
    </DashboardShell>
  );
}
