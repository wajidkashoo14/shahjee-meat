import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/shop/legal-page";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === "ja") {
    return (
      <LegalPage title="Whole Cutsについて">
        <p>Whole Cutsは、日本国内のご家庭とプロの厨房に、最高品質の冷凍肉をお届けするオンライン精肉店です。</p>
        <p>
          オーストラリアの牧草牛から国産和牛、上質なシャルキュトリーまで、世界各地の生産者と直接つながり、フレーバーとトレーサビリティに妥協のないラインナップを揃えています。すべての商品は品質を保つため−18℃で急速冷凍し、クールチェーンで発送しています。
        </p>
        <h2>私たちのこだわり</h2>
        <ul>
          <li>生産者から直接買い付け、中間マージンを抑えた価格でご提供</li>
          <li>ブロック肉から使い切りサイズまで、ご家庭に合った量をご用意</li>
          <li>すべての商品ページに焼き方ガイドを掲載</li>
        </ul>
      </LegalPage>
    );
  }

  return (
    <LegalPage title="About Whole Cuts">
      <p>
        Whole Cuts is an online butcher shop bringing chef-grade, flash-frozen meat to home cooks and restaurants across Japan.
      </p>
      <p>
        From Australian grass-fed beef to Japanese Wagyu and fine European charcuterie, we work directly with producers around the
        world to source cuts we&rsquo;d be proud to put on our own table — flavor and traceability, no compromises. Everything is
        flash-frozen at −18°C and shipped in cool-chain packaging to lock that quality in.
      </p>
      <h2>What we care about</h2>
      <ul>
        <li>Buying direct from producers to keep pricing honest</li>
        <li>Offering sizes that make sense for a household, not just a restaurant</li>
        <li>A real cooking guide on every single product page</li>
      </ul>
    </LegalPage>
  );
}
