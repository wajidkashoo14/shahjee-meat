"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      if (error) {
        toast.error(error.message ?? t("signInError"));
        return;
      }
      setSent(true);
    });
  }

  if (sent) return <p className="rounded-xl border border-border bg-surface p-4 text-sm text-success">{t("resetLinkSent", { email })}</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="forgot-email">{t("email")}</Label>
        <Input id="forgot-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("sendResetLink")}
      </Button>
    </form>
  );
}
