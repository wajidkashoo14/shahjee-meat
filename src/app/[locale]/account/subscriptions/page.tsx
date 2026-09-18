import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { getMySubscriptions } from "@/server/account";
import { SubscriptionCard } from "@/components/account/subscription-card";

export default async function SubscriptionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.subscriptions");
  const subs = await getMySubscriptions(session!.user.id);

  if (subs.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {subs.map((sub) => (
        <SubscriptionCard key={sub.id} sub={sub} />
      ))}
    </div>
  );
}
