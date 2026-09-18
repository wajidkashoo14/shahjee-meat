import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/shop/legal-page";

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === "ja") {
    return (
      <LegalPage title="配送について">
        <h2>クール便配送</h2>
        <p>全国送料は¥1,200（税込）です。北海道・沖縄へのお届けは追加で¥1,500の遠方料金がかかります。ご注文合計¥15,000以上で送料無料になります。</p>
        <h2>お届け日時</h2>
        <p>ご注文からもっとも早くて2営業日後にお届け可能です。以下の時間帯からお選びいただけます。</p>
        <ul>
          <li>午前中</li>
          <li>14:00〜16:00</li>
          <li>16:00〜18:00</li>
          <li>18:00〜20:00</li>
          <li>19:00〜21:00</li>
        </ul>
        <h2>配送業者</h2>
        <p>ヤマト運輸または佐川急便のクール便でお届けします。発送後、追跡番号をメールでお知らせします。</p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Shipping & Delivery">
      <h2>Cool delivery</h2>
      <p>
        Nationwide shipping is ¥1,200 (tax included). Hokkaido and Okinawa carry an additional ¥1,500 remote-area surcharge.
        Orders over ¥15,000 ship free.
      </p>
      <h2>Delivery date & time</h2>
      <p>The earliest delivery date is 2 business days after your order. Choose from:</p>
      <ul>
        <li>Morning (8:00–12:00)</li>
        <li>14:00–16:00</li>
        <li>16:00–18:00</li>
        <li>18:00–20:00</li>
        <li>19:00–21:00</li>
      </ul>
      <h2>Carriers</h2>
      <p>We ship via Yamato Transport or Sagawa Express cool delivery. You&rsquo;ll receive a tracking number by email once it ships.</p>
    </LegalPage>
  );
}
