import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { getMyWishlist } from "@/server/account";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.wishlist");
  const items = await getMyWishlist(session!.user.id);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
      </Card>
    );
  }

  return <WishlistGrid items={items} />;
}
