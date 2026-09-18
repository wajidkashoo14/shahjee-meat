"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const t = useTranslations("account.settings");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
      if (error) {
        toast.error(error.message ?? "Something went wrong.");
        return;
      }
      toast.success(t("passwordUpdated"));
      setCurrent("");
      setNext("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="current-password">{t("currentPassword")}</Label>
        <Input id="current-password" type="password" className="mt-1" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="new-password">{t("newPassword")}</Label>
        <Input id="new-password" type="password" className="mt-1" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {t("updatePassword")}
      </Button>
    </form>
  );
}
