import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/shop/legal-page";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === "ja") {
    return (
      <LegalPage title="プライバシーポリシー">
        <p>Whole Cuts（以下「当社」）は、個人情報保護法を遵守し、お客様の個人情報を適切に取り扱います。</p>
        <h2>取得する情報</h2>
        <p>氏名、住所、電話番号、メールアドレス、注文履歴、お支払い情報（決済代行会社を通じて処理され、当社では保持しません）を取得します。</p>
        <h2>利用目的</h2>
        <ul>
          <li>ご注文の処理・配送手配</li>
          <li>カスタマーサポートの提供</li>
          <li>マーケティング情報の配信（同意いただいた場合のみ）</li>
        </ul>
        <h2>お客様の権利</h2>
        <p>マイページの「プロフィールと設定」から、いつでもご自身のデータの開示・訂正・削除を請求できます。</p>
        <h2>お問い合わせ</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、お問い合わせフォームよりご連絡ください。</p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Privacy Policy">
      <p>Whole Cuts (&ldquo;we&rdquo;) handles your personal data in accordance with Japan&rsquo;s Act on the Protection of Personal Information (APPI).</p>
      <h2>Information we collect</h2>
      <p>
        Name, address, phone number, email, order history, and payment details (processed by our payment provider — we never
        store full card numbers ourselves).
      </p>
      <h2>How we use it</h2>
      <ul>
        <li>Processing and shipping your orders</li>
        <li>Providing customer support</li>
        <li>Sending marketing communications, only if you&rsquo;ve opted in</li>
      </ul>
      <h2>Your rights</h2>
      <p>You can request access, correction, or deletion of your data at any time from Profile &amp; Security in your account.</p>
      <h2>Contact</h2>
      <p>For any privacy-related questions, please reach out through our contact form.</p>
    </LegalPage>
  );
}
