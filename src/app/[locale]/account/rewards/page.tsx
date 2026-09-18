import { headers } from "next/headers";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { getMyPointsLedger, getMyReferral } from "@/server/account";
import { CopyReferralButton } from "@/components/account/copy-referral-button";

export default async function RewardsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.rewards");
  const locale = await getLocale();
  const [ledger, referral] = await Promise.all([
    getMyPointsLedger(session!.user.id),
    getMyReferral(session!.user.id),
  ]);
  const balance = (session!.user as { pointsBalance?: number }).pointsBalance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-foreground-muted">{t("pointsBalance")}</p>
          <p className="mt-1 font-display text-4xl">{balance.toLocaleString()} pt</p>
          <p className="mt-2 text-sm text-foreground-muted">{t("pointsHint")}</p>
        </CardContent>
      </Card>

      {referral && (
        <Card>
          <CardContent className="pt-6">
            <p className="font-medium">{t("referralTitle")}</p>
            <p className="mt-1 text-sm text-foreground-muted">{t("referralDesc")}</p>
            <div className="mt-3 flex items-center gap-3">
              <code className="rounded-lg bg-surface-raised px-3 py-2 text-sm font-semibold">{referral.code}</code>
              <CopyReferralButton code={referral.code} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="font-medium">{t("history")}</p>
          {ledger.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">{t("empty")}</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {ledger.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="capitalize text-foreground-muted">
                    {entry.reason} · {entry.createdAt.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}
                  </span>
                  <span className={entry.points > 0 ? "text-success" : "text-sale"}>
                    {entry.points > 0 ? "+" : ""}
                    {entry.points} pt
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
