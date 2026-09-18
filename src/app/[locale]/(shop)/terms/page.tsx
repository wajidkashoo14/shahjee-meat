import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/shop/legal-page";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === "ja") {
    return (
      <LegalPage title="利用規約">
        <p>本規約は、Whole Cutsが提供するオンラインストア（以下「本サービス」）のご利用条件を定めるものです。</p>
        <h2>ご注文</h2>
        <p>ご注文の確定はお客様による発注をもって成立し、当社が注文確認メールを送信した時点で契約が成立します。</p>
        <h2>価格・お支払い</h2>
        <p>表示価格はすべて税込です。お支払いはクレジットカードまたはコンビニ決済でお願いします。</p>
        <h2>キャンセル・返品</h2>
        <p>食品という商品の性質上、お客様都合による返品はお受けできません。不良品・誤配送の場合は、お問い合わせフォームよりご連絡ください。</p>
        <h2>免責事項</h2>
        <p>天災や配送業者の遅延など、当社の責によらない事由によるお届けの遅延について、当社は責任を負いかねます。</p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Terms of Service">
      <p>These terms govern your use of the Whole Cuts online store (&ldquo;the Service&rdquo;).</p>
      <h2>Orders</h2>
      <p>Placing an order is an offer to purchase; a contract is formed once we send you an order confirmation email.</p>
      <h2>Pricing & payment</h2>
      <p>All displayed prices are tax-inclusive. We accept payment by credit card or convenience-store (Konbini) payment.</p>
      <h2>Cancellations & returns</h2>
      <p>
        Because our products are perishable food items, we&rsquo;re unable to accept returns for change of mind. If an item arrives
        damaged or incorrect, please contact us through our contact form.
      </p>
      <h2>Liability</h2>
      <p>We are not liable for delivery delays caused by events outside our control, including weather and carrier delays.</p>
    </LegalPage>
  );
}
