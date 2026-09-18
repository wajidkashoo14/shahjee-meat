"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitInquiryAction } from "@/server/actions/engagement-actions";

export function NewsletterForm() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await submitInquiryAction({ kind: "general", name: "Newsletter signup", email, message: "Newsletter signup" });
      setDone(true);
    });
  }

  if (done) return <p className="text-sm text-success">{t("newsletterThanks")}</p>;

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <Input
        type="email"
        required
        placeholder={t("newsletterPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-surface"
      />
      <Button type="submit" disabled={pending}>
        <Mail className="size-4" /> {t("newsletterCta")}
      </Button>
    </form>
  );
}
