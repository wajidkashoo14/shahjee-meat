"use client";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error(t("invalidResetLink"));
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) {
        toast.error(error.message ?? t("signInError"));
        return;
      }
      toast.success(t("passwordReset"));
      router.push("/sign-in");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="reset-password">{t("newPassword")}</Label>
        <Input id="reset-password" type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("resetPassword")}
      </Button>
    </form>
  );
}
