"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EyeOff, Send } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { answerQuestionAction, hideQuestionAction } from "@/server/actions/admin-actions";

export function QuestionModerationRow({
  question,
}: {
  question: { id: string; body: string; authorName: string; status: string; productName?: string; answers: Array<{ id: string; body: string; authorName: string }> };
}) {
  const [pending, startTransition] = useTransition();
  const [answer, setAnswer] = useState("");
  const router = useRouter();

  function submitAnswer() {
    if (!answer.trim()) return;
    startTransition(async () => {
      await answerQuestionAction({ questionId: question.id, body: answer });
      toast.success("Answer posted.");
      setAnswer("");
      router.refresh();
    });
  }

  function hide() {
    startTransition(async () => {
      await hideQuestionAction(question.id);
      toast.success("Question hidden.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium">{question.productName}</p>
          <Badge variant={question.status === "answered" ? "new" : question.status === "hidden" ? "outline" : "sale"}>{question.status}</Badge>
        </div>
        <p className="mt-2">Q. {question.body}</p>
        <p className="mt-1 text-xs text-foreground-muted">— {question.authorName}</p>

        {question.answers.map((a) => (
          <div key={a.id} className="mt-3 rounded-xl bg-surface-raised p-3 text-sm">
            <p className="mb-1 text-xs font-semibold text-primary">{a.authorName}</p>
            {a.body}
          </div>
        ))}

        {question.status !== "hidden" && (
          <div className="mt-3 flex flex-col gap-2">
            <Textarea placeholder="Write a reply…" rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" disabled={pending || !answer.trim()} onClick={submitAnswer}>
                <Send className="size-4" /> Post answer
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={hide}>
                <EyeOff className="size-4" /> Hide
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
