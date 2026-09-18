"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitInquiryAction } from "@/server/actions/engagement-actions";

export function BulkInquiryForm({ productId, productName }: { productId: string; productName: string }) {
  const t = useTranslations("product");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState(t("bulkDefaultMessage", { productName }));
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function submit() {
    startTransition(async () => {
      try {
        await submitInquiryAction({ kind: "wholesale", productId, name, email, company, message });
        setSent(true);
        toast.success(t("inquirySent"));
      } catch {
        toast.error(t("inquiryError"));
      }
    });
  }

  if (sent) {
    return <p className="rounded-xl border border-border p-4 text-sm text-success">{t("inquirySent")}</p>;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="font-display text-lg">{t("bulkInquiryTitle")}</p>
      <p className="mt-1 text-sm text-foreground-muted">{t("bulkInquiryDesc")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="bulk-name">{t("yourName")}</Label>
          <Input id="bulk-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bulk-email">{t("emailAddress")}</Label>
          <Input id="bulk-email" className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="bulk-company">{t("companyOptional")}</Label>
          <Input id="bulk-company" className="mt-1" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="bulk-message">{t("message")}</Label>
          <Textarea id="bulk-message" className="mt-1" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </div>
      <Button className="mt-4" onClick={submit} disabled={pending || !name || !email}>
        {t("sendInquiry")}
      </Button>
    </div>
  );
}
