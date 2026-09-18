"use client";
import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { completeSignInAction } from "@/server/actions/auth-actions";

export function SignUpForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.signUp.email({ email, password, name, locale } as never);
      if (error) {
        toast.error(error.message ?? t("signUpError"));
        return;
      }
      await completeSignInAction();
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="signup-name">{t("fullName")}</Label>
        <Input id="signup-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="signup-email">{t("email")}</Label>
        <Input id="signup-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="signup-password">{t("password")}</Label>
        <Input id="signup-password" type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <p className="mt-1 text-xs text-foreground-muted">{t("passwordHint")}</p>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("createAccount")}
      </Button>
      <p className="text-center text-sm text-foreground-muted">
        {t("haveAccount")}{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
