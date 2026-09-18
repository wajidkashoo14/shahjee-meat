"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitInquiryAction } from "@/server/actions/engagement-actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitInquiryAction({ kind: "general", name, email, message });
        setSent(true);
        toast.success(t("sent"));
      } catch {
        toast.error(t("error"));
      }
    });
  }

  if (sent) return <p className="rounded-xl border border-border bg-surface p-6 text-success">{t("sent")}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="contact-name">{t("name")}</Label>
        <Input id="contact-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="contact-email">{t("email")}</Label>
        <Input id="contact-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea id="contact-message" className="mt-1" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {t("send")}
      </Button>
    </form>
  );
}
