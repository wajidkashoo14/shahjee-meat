"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfileAction } from "@/server/actions/account-actions";
import { useRouter } from "@/i18n/navigation";

export function ProfileForm({ name, email, phone, locale }: { name: string; email: string; phone: string; locale: "en" | "ja" }) {
  const t = useTranslations("account.settings");
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [localeVal, setLocaleVal] = useState(locale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateProfileAction({ name: nameVal, phone: phoneVal, locale: localeVal });
      toast.success(t("saved"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="profile-name">{t("name")}</Label>
        <Input id="profile-name" className="mt-1" value={nameVal} onChange={(e) => setNameVal(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="profile-email">{t("email")}</Label>
        <Input id="profile-email" className="mt-1" value={email} disabled />
      </div>
      <div>
        <Label htmlFor="profile-phone">{t("phone")}</Label>
        <Input id="profile-phone" className="mt-1" value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="profile-language">{t("language")}</Label>
        <Select value={localeVal} onValueChange={(v) => setLocaleVal(v as "en" | "ja")}>
          <SelectTrigger id="profile-language" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {t("save")}
      </Button>
    </form>
  );
}
