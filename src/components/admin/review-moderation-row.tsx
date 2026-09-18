"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, EyeOff } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shop/star-rating";
import { moderateReviewAction } from "@/server/actions/admin-actions";

export function ReviewModerationRow({
  review,
}: {
  review: { id: string; rating: number; title: string; body: string; authorName: string; status: string; productName?: string };
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function moderate(status: "approved" | "hidden") {
    startTransition(async () => {
      await moderateReviewAction(review.id, status);
      toast.success(status === "approved" ? "Review published." : "Review hidden.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <StarRating rating={review.rating} />
            <p className="mt-1 text-sm font-medium">{review.productName}</p>
          </div>
          <Badge variant={review.status === "approved" ? "new" : review.status === "hidden" ? "outline" : "sale"}>{review.status}</Badge>
        </div>
        {review.title && <p className="mt-2 font-medium">{review.title}</p>}
        <p className="mt-1 text-sm text-foreground-muted">{review.body}</p>
        <p className="mt-1 text-xs text-foreground-muted">— {review.authorName}</p>
        <div className="mt-3 flex gap-2">
          {review.status !== "approved" && (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => moderate("approved")}>
              <Check className="size-4" /> Approve
            </Button>
          )}
          {review.status !== "hidden" && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => moderate("hidden")}>
              <EyeOff className="size-4" /> Hide
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
