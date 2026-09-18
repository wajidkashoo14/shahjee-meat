"use client";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { completeSignInAction } from "@/server/actions/auth-actions";

export function SignInForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pending, startTransition] = useTransition();
  const [magicSent, setMagicSent] = useState(false);

  function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        toast.error(error.message ?? t("signInError"));
        return;
      }
      await completeSignInAction();
      router.push(next);
      router.refresh();
    });
  }

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
      if (error) {
        toast.error(error.message ?? t("signInError"));
        return;
      }
      setMagicSent(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {mode === "password" ? (
        <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="signin-email">{t("email")}</Label>
            <Input id="signin-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password">{t("password")}</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Input id="signin-password" type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("signIn")}
          </Button>
        </form>
      ) : magicSent ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-success">{t("magicLinkSent", { email })}</p>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="signin-email">{t("email")}</Label>
            <Input id="signin-email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("sendMagicLink")}
          </Button>
        </form>
      )}

      <button
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="flex items-center justify-center gap-2 text-sm text-foreground-muted hover:text-foreground"
      >
        <Mail className="size-4" />
        {mode === "password" ? t("useMagicLinkInstead") : t("usePasswordInstead")}
      </button>

      <Separator />

      <p className="text-center text-sm text-foreground-muted">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          {t("signUp")}
        </Link>
      </p>

      <p className="text-center text-xs text-foreground-muted">
        {t("demoCreds")}
      </p>
    </div>
  );
}
