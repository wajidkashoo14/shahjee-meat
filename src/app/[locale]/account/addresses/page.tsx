import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyAddresses } from "@/server/account";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { AddressActions } from "@/components/account/address-actions";

export default async function AddressesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.addresses");
  const list = await getMyAddresses(session!.user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddressFormDialog />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
        </Card>
      ) : (
        list.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{addr.label}</p>
                  {addr.isDefault && <Badge variant="outline">{t("default")}</Badge>}
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  {addr.fullName} — {addr.phone}
                </p>
                <p className="text-sm text-foreground-muted">
                  〒{addr.postalCode} {addr.prefecture}
                  {addr.city} {addr.addressLine1} {addr.addressLine2}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <AddressFormDialog address={addr} />
                <AddressActions addressId={addr.id} isDefault={addr.isDefault} />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
