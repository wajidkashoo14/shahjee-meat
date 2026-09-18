"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ThumbsUp, BadgeCheck, Snowflake } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StarRating } from "@/components/shop/star-rating";
import { authClient } from "@/lib/auth-client";
import { submitReviewAction, submitQuestionAction } from "@/server/actions/engagement-actions";
import type { products, reviews, questions, answers } from "@/db/schema";

type Product = typeof products.$inferSelect;
type Review = typeof reviews.$inferSelect & { images: { url: string }[] };
type QA = typeof questions.$inferSelect & { answers: (typeof answers.$inferSelect)[] };

export function ProductTabs({ product, reviews, qa }: { product: Product; reviews: Review[]; qa: QA[] }) {
  const locale = useLocale() as "en" | "ja";
  const t = useTranslations("product");

  return (
    <Tabs defaultValue="description" className="mt-16">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="description">{t("tabs.description")}</TabsTrigger>
        <TabsTrigger value="cooking">{t("tabs.cooking")}</TabsTrigger>
        <TabsTrigger value="details">{t("tabs.details")}</TabsTrigger>
        <TabsTrigger value="reviews">{t("tabs.reviews", { count: reviews.length })}</TabsTrigger>
        <TabsTrigger value="qa">{t("tabs.qa", { count: qa.length })}</TabsTrigger>
        <TabsTrigger value="frozen">{t("tabs.frozen")}</TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        <div className="max-w-3xl whitespace-pre-line text-foreground-muted leading-relaxed">
          {locale === "ja" ? product.descriptionJa : product.descriptionEn}
        </div>
      </TabsContent>

      <TabsContent value="cooking">
        <div className="max-w-3xl whitespace-pre-line text-foreground-muted leading-relaxed">
          {locale === "ja" ? product.cookingGuideJa : product.cookingGuideEn}
        </div>
      </TabsContent>

      <TabsContent value="details">
        <table className="w-max min-w-[320px] text-sm">
          <tbody>
            <DetailRow label={t("details.origin")} value={product.origin} />
            {product.feed && <DetailRow label={t("details.feed")} value={product.feed} />}
            {product.grade && <DetailRow label={t("details.grade")} value={product.grade} />}
            {product.cut && <DetailRow label={t("details.cut")} value={product.cut} />}
            <DetailRow label={t("details.delivered")} value={t("details.frozenAt")} />
          </tbody>
        </table>
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewsPanel productId={product.id} reviews={reviews} />
      </TabsContent>

      <TabsContent value="qa">
        <QAPanel productId={product.id} qa={qa} />
      </TabsContent>

      <TabsContent value="frozen">
        <div className="max-w-3xl text-foreground-muted leading-relaxed">
          <p className="mb-3">{t("frozenHandling.intro")}</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>{t("frozenHandling.tip1")}</li>
            <li>{t("frozenHandling.tip2")}</li>
            <li>{t("frozenHandling.tip3")}</li>
            <li>{t("frozenHandling.tip4")}</li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-8 font-medium text-foreground-muted">{label}</td>
      <td className="py-3 capitalize">{value}</td>
    </tr>
  );
}

function ReviewsPanel({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const t = useTranslations("product");
  const { data: session } = authClient.useSession();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  function submit() {
    if (!name || body.length < 10) {
      toast.error(t("reviewValidation"));
      return;
    }
    startTransition(async () => {
      await submitReviewAction({ productId, rating, title, body, authorName: name });
      setSubmitted(true);
      toast.success(t("reviewSubmitted"));
    });
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-display">{avg.toFixed(1)}</span>
          <StarRating rating={avg} size="md" />
        </div>
        <p className="mt-1 text-sm text-foreground-muted">{t("tabs.reviews", { count: reviews.length })}</p>
        <div className="mt-4 flex flex-col gap-1">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs">
              <span className="w-3">{b.star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full bg-brass" style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-right text-foreground-muted">{b.count}</span>
            </div>
          ))}
        </div>
        {!showForm && !submitted && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            {t("writeReview")}
          </Button>
        )}
        {showForm && !submitted && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} aria-label={`${s} stars`}>
                  <StarRating rating={s <= rating ? 5 : 0} />
                </button>
              ))}
            </div>
            <Input placeholder={t("yourName")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder={t("reviewTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder={t("reviewBody")} value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <Button onClick={submit} disabled={pending}>
              {t("submitReview")}
            </Button>
          </div>
        )}
        {submitted && <p className="mt-4 text-sm text-success">{t("reviewSubmitted")}</p>}
      </div>

      <div className="flex flex-col divide-y divide-border">
        {reviews.length === 0 && <p className="py-6 text-foreground-muted">{t("noReviewsYet")}</p>}
        {reviews.map((r) => (
          <div key={r.id} className="py-5">
            <div className="flex items-center gap-2">
              <StarRating rating={r.rating} />
              {r.verifiedPurchase && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <BadgeCheck className="size-3.5" /> {t("verifiedPurchase")}
                </span>
              )}
            </div>
            {r.title && <p className="mt-1 font-medium">{r.title}</p>}
            <p className="mt-1 text-sm text-foreground-muted">{r.body}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
              <span>{r.authorName}</span>
              <span>·</span>
              <button className="flex items-center gap-1 hover:text-foreground">
                <ThumbsUp className="size-3.5" /> {t("helpful")} ({r.helpfulCount})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QAPanel({ productId, qa }: { productId: string; qa: QA[] }) {
  const t = useTranslations("product");
  const { data: session } = authClient.useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!name || body.length < 5) {
      toast.error(t("reviewValidation"));
      return;
    }
    startTransition(async () => {
      await submitQuestionAction({ productId, body, authorName: name });
      setSubmitted(true);
      toast.success(t("questionSubmitted"));
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {!submitted ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">{t("askQuestion")}</p>
          <Input placeholder={t("yourName")} value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder={t("questionPlaceholder")} value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <Button onClick={submit} disabled={pending} className="self-start">
            {t("submitQuestion")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-success">{t("questionSubmitted")}</p>
      )}

      <div className="flex flex-col divide-y divide-border">
        {qa.length === 0 && <p className="py-6 text-foreground-muted">{t("noQuestionsYet")}</p>}
        {qa.map((q) => (
          <div key={q.id} className="py-5">
            <p className="font-medium">Q. {q.body}</p>
            <p className="mt-1 text-xs text-foreground-muted">{q.authorName}</p>
            {q.answers.map((a) => (
              <div key={a.id} className="mt-3 rounded-xl bg-surface-raised p-3 text-sm">
                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Snowflake className="size-3.5" /> {a.authorName}
                </p>
                {a.body}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
