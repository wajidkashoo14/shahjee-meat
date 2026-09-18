import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listReviewsAdmin, listQuestionsAdmin } from "@/server/admin";
import { ReviewModerationRow } from "@/components/admin/review-moderation-row";
import { QuestionModerationRow } from "@/components/admin/question-moderation-row";

export default async function AdminReviewsPage() {
  const [reviews, questions] = await Promise.all([listReviewsAdmin(), listQuestionsAdmin()]);

  return (
    <Tabs defaultValue="reviews">
      <TabsList>
        <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        <TabsTrigger value="qa">Q&amp;A ({questions.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="reviews">
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <ReviewModerationRow
              key={r.id}
              review={{ id: r.id, rating: r.rating, title: r.title, body: r.body, authorName: r.authorName, status: r.status, productName: r.product?.nameEn }}
            />
          ))}
          {reviews.length === 0 && <p className="py-8 text-center text-foreground-muted">No reviews yet.</p>}
        </div>
      </TabsContent>
      <TabsContent value="qa">
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <QuestionModerationRow
              key={q.id}
              question={{ id: q.id, body: q.body, authorName: q.authorName, status: q.status, productName: q.product?.nameEn, answers: q.answers }}
            />
          ))}
          {questions.length === 0 && <p className="py-8 text-center text-foreground-muted">No questions yet.</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
