import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/shop/legal-page";

export default async function FrozenHandlingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === "ja") {
    return (
      <LegalPage title="冷凍肉の取り扱い方">
        <p>すべての商品は−18℃で急速冷凍し、保冷剤とともに断熱パッケージで発送しています。</p>
        <h2>保管方法</h2>
        <p>使用するまで冷凍庫で保管してください。解凍後の再冷凍は品質と安全のため避けてください。</p>
        <h2>解凍方法</h2>
        <p>厚さに応じて冷蔵庫で12〜24時間かけて解凍するのが最適です。急ぐ場合は密封したまま冷水に浸け、30分ごとに水を交換してください。常温での解凍はお控えください。</p>
        <h2>調理と保存</h2>
        <p>解凍後は2〜3日以内に調理してください。各商品ページの「焼き方ガイド」もあわせてご確認ください。</p>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="Handling Frozen Meat">
      <p>Every order ships flash-frozen at −18°C in insulated packaging with gel ice packs to keep it that way in transit.</p>
      <h2>Storage</h2>
      <p>Keep frozen until you&rsquo;re ready to use it. Don&rsquo;t refreeze after thawing — quality and food safety both suffer.</p>
      <h2>Thawing</h2>
      <p>
        The best method is a slow thaw in the refrigerator, 12–24 hours depending on thickness. In a hurry? Submerge the sealed
        package in cold water, changing it every 30 minutes. Avoid thawing at room temperature.
      </p>
      <h2>Cooking & storage</h2>
      <p>Once thawed, cook within 2–3 days for the best quality. Check the Cooking Guide tab on each product page for cut-specific advice.</p>
    </LegalPage>
  );
}
