import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DangerZone } from "@/components/account/danger-zone";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.settings");
  const user = session!.user as { name: string; email: string; phone?: string; locale?: "en" | "ja" };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} locale={user.locale ?? "en"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("security")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
