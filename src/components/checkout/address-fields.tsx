"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PREFECTURES } from "@/lib/shipping";

export type AddressValue = {
  fullName: string;
  fullNameKana: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
};

export function AddressFields({ value, onChange }: { value: AddressValue; onChange: (v: AddressValue) => void }) {
  const t = useTranslations("checkout");
  const [looking, setLooking] = useState(false);

  function set<K extends keyof AddressValue>(key: K, v: AddressValue[K]) {
    onChange({ ...value, [key]: v });
  }

  async function lookupPostalCode(code: string) {
    const digits = code.replace(/[^0-9]/g, "");
    if (digits.length !== 7) return;
    setLooking(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
      const data = await res.json();
      const result = data?.results?.[0];
      if (result) {
        onChange({
          ...value,
          postalCode: code,
          prefecture: mapPrefecture(result.address1),
          city: `${result.address2}${result.address3}`,
        });
      }
    } catch {
      // Non-fatal — user can still fill the address manually.
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={t("fullName")} id="addr-full-name">
        <Input id="addr-full-name" value={value.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      </Field>
      <Field label={t("fullNameKana")} id="addr-full-name-kana">
        <Input id="addr-full-name-kana" value={value.fullNameKana} onChange={(e) => set("fullNameKana", e.target.value)} placeholder="タナカ タロウ" />
      </Field>
      <Field label={t("phone")} id="addr-phone">
        <Input id="addr-phone" type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} required />
      </Field>
      <Field label={t("postalCode")} id="addr-postal-code">
        <div className="relative">
          <Input
            id="addr-postal-code"
            value={value.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            onBlur={(e) => lookupPostalCode(e.target.value)}
            placeholder="150-0001"
            required
          />
          {looking && <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-foreground-muted" />}
        </div>
      </Field>
      <Field label={t("prefecture")} id="addr-prefecture">
        <Select value={value.prefecture} onValueChange={(v) => set("prefecture", v)}>
          <SelectTrigger id="addr-prefecture">
            <SelectValue placeholder={t("selectPrefecture")} />
          </SelectTrigger>
          <SelectContent>
            {PREFECTURES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t("city")} id="addr-city">
        <Input id="addr-city" value={value.city} onChange={(e) => set("city", e.target.value)} required />
      </Field>
      <Field label={t("addressLine1")} id="addr-line1" full>
        <Input id="addr-line1" value={value.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} required />
      </Field>
      <Field label={t("addressLine2")} id="addr-line2" full>
        <Input id="addr-line2" value={value.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} placeholder={t("addressLine2Placeholder")} />
      </Field>
    </div>
  );
}

function Field({ label, id, children, full }: { label: string; id?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function mapPrefecture(japaneseName: string): string {
  const map: Record<string, string> = {
    北海道: "Hokkaido", 青森県: "Aomori", 岩手県: "Iwate", 宮城県: "Miyagi", 秋田県: "Akita",
    山形県: "Yamagata", 福島県: "Fukushima", 茨城県: "Ibaraki", 栃木県: "Tochigi", 群馬県: "Gunma",
    埼玉県: "Saitama", 千葉県: "Chiba", 東京都: "Tokyo", 神奈川県: "Kanagawa", 新潟県: "Niigata",
    富山県: "Toyama", 石川県: "Ishikawa", 福井県: "Fukui", 山梨県: "Yamanashi", 長野県: "Nagano",
    岐阜県: "Gifu", 静岡県: "Shizuoka", 愛知県: "Aichi", 三重県: "Mie", 滋賀県: "Shiga",
    京都府: "Kyoto", 大阪府: "Osaka", 兵庫県: "Hyogo", 奈良県: "Nara", 和歌山県: "Wakayama",
    鳥取県: "Tottori", 島根県: "Shimane", 岡山県: "Okayama", 広島県: "Hiroshima", 山口県: "Yamaguchi",
    徳島県: "Tokushima", 香川県: "Kagawa", 愛媛県: "Ehime", 高知県: "Kochi", 福岡県: "Fukuoka",
    佐賀県: "Saga", 長崎県: "Nagasaki", 熊本県: "Kumamoto", 大分県: "Oita", 宮崎県: "Miyazaki",
    鹿児島県: "Kagoshima", 沖縄県: "Okinawa",
  };
  return map[japaneseName] ?? japaneseName;
}
