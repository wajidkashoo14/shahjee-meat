import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { settings } from "@/db/schema";
import { LegalPage } from "@/components/shop/legal-page";

const ROWS_EN: Array<[string, string]> = [
  ["Seller", "Whole Cuts LLC"],
  ["Person responsible", "Kenji Sato"],
  ["Address", "1-1-1 Jingumae, Shibuya-ku, Tokyo 150-0001, Japan"],
  ["Phone", "03-1234-5678 (Weekdays 10:00–18:00 JST)"],
  ["Email", "support@wholecuts.example"],
  ["Selling price", "Tax-inclusive price shown on each product page"],
  ["Additional fees", "Shipping fee, varies by prefecture"],
  ["Delivery time", "Ships within 2 business days of order"],
  ["Accepted payment", "Credit card, convenience-store (Konbini) payment"],
  ["Returns", "Due to the perishable nature of our products, we cannot accept returns. Please contact us for defective or incorrect items."],
];

export default async function TokushohoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "tokushoho_text") });
  const jaText = row ? (JSON.parse(row.value) as string) : "";

  if (locale === "ja") {
    return (
      <LegalPage title="特定商取引法に基づく表記">
        <p className="whitespace-pre-line">{jaText}</p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Legal Notice (Act on Specified Commercial Transactions)">
      <p className="mb-4 text-sm">
        Japanese law (特定商取引法) requires online sellers to disclose the following information. An English summary is
        provided below for convenience; the Japanese version is the governing text.
      </p>
      <dl className="flex flex-col gap-3">
        {ROWS_EN.map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 gap-1 border-b border-border pb-3 sm:grid-cols-[180px_1fr]">
            <dt className="font-medium text-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </LegalPage>
  );
}
