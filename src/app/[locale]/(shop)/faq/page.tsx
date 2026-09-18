import { setRequestLocale } from "next-intl/server";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_EN = [
  { q: "How is the meat kept frozen during delivery?", a: "Every order ships in insulated, cool-chain packaging with gel ice packs, and is handed off to Yamato or Sagawa's refrigerated delivery service, which typically keeps items frozen for 24–36 hours in transit." },
  { q: "Can I choose my delivery date and time?", a: "Yes — at checkout you can pick any available date starting 2 business days out, and one of five delivery time slots." },
  { q: "What if an item is sold out?", a: "Sold-out weight options show a \"Notify me\" form on the product page — we'll email you the moment it's back in stock." },
  { q: "Do you offer wholesale pricing?", a: "Yes, most product pages have a bulk/wholesale inquiry form near the bottom. We work with restaurants and retailers across Japan." },
  { q: "What payment methods do you accept?", a: "Credit cards and konbini (convenience store) payment via Stripe." },
  { q: "Can I cancel an order?", a: "Orders can be cancelled from your account before the packing cutoff shown on the order detail page." },
];
const FAQ_JA = [
  { q: "配送中、お肉はどのように冷凍状態が保たれますか？", a: "すべてのご注文は保冷剤とともに断熱パッケージに梱包し、ヤマト運輸または佐川急便のクール便でお届けします。配送中は通常24〜36時間、冷凍状態を保つことができます。" },
  { q: "配送日時は指定できますか？", a: "はい。チェックアウト時に、最短2営業日後から配送日を、5つの時間帯からお時間をお選びいただけます。" },
  { q: "商品が売り切れの場合はどうすればいいですか？", a: "売り切れのサイズには商品ページに「入荷通知」フォームが表示されます。再入荷時にメールでお知らせします。" },
  { q: "卸売価格はありますか？", a: "はい。多くの商品ページ下部に卸売お問い合わせフォームがございます。全国の飲食店・小売店様とお取引しております。" },
  { q: "お支払い方法は何がありますか？", a: "Stripe経由でのクレジットカード決済およびコンビニ決済に対応しています。" },
  { q: "注文をキャンセルできますか？", a: "注文詳細ページに表示される梱包締切前であれば、マイページからキャンセル可能です。" },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = locale === "ja" ? FAQ_JA : FAQ_EN;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl">{locale === "ja" ? "よくある質問" : "Frequently Asked Questions"}</h1>
      <Accordion type="single" collapsible className="mt-8">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
