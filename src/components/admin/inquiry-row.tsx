"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { replyInquiryAction, closeInquiryAction } from "@/server/actions/admin-actions";

export function InquiryRow({
  inquiry,
}: {
  inquiry: { id: string; kind: string; name: string; email: string; company: string; message: string; status: string; createdAt: Date };
}) {
  const [pending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const router = useRouter();

  function submitReply() {
    if (!reply.trim()) return;
    startTransition(async () => {
      await replyInquiryAction({ id: inquiry.id, message: reply });
      toast.success("Reply sent.");
      setReply("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{inquiry.name} {inquiry.company && `— ${inquiry.company}`}</p>
            <p className="text-xs text-foreground-muted">{inquiry.email} · {inquiry.createdAt.toLocaleDateString()}</p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline">{inquiry.kind}</Badge>
            <Badge variant={inquiry.status === "open" ? "sale" : inquiry.status === "replied" ? "new" : "outline"}>{inquiry.status}</Badge>
          </div>
        </div>
        <p className="mt-2 text-sm text-foreground-muted">{inquiry.message}</p>

        {inquiry.status !== "closed" && (
          <div className="mt-3 flex flex-col gap-2">
            <Textarea placeholder="Write a reply…" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" disabled={pending || !reply.trim()} onClick={submitReply}>
                <Send className="size-4" /> Send reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => startTransition(async () => { await closeInquiryAction(inquiry.id); toast.success("Closed."); router.refresh(); })}
              >
                <X className="size-4" /> Close
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
