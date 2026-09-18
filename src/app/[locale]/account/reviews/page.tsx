import { headers } from "next/headers";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/shop/star-rating";
import { getMyReviews } from "@/server/account";
import { DeleteReviewButton } from "@/components/account/delete-review-button";

export default async function MyReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("account.reviews");
  const locale = await getLocale();
  const myReviews = await getMyReviews(session!.user.id);

  if (myReviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-foreground-muted">{t("empty")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {myReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <StarRating rating={review.rating} />
                {review.product && (
                  <Link href={`/products/${review.product.slug}`} className="mt-1 block text-sm font-medium hover:text-primary">
                    {locale === "ja" ? review.product.nameJa : review.product.nameEn}
                  </Link>
                )}
              </div>
              <span className="rounded-full bg-surface-raised px-3 py-1 text-xs">{t(`status.${review.status}` as never)}</span>
            </div>
            {review.title && <p className="mt-2 font-medium">{review.title}</p>}
            <p className="mt-1 text-sm text-foreground-muted">{review.body}</p>
            <div className="mt-3">
              <DeleteReviewButton reviewId={review.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
