/**
 * Seeds the Postgres database with demo content: 3 users (customer,
 * staff, admin), tags, collections, ~40 products with weight variants,
 * reviews, Q&A, recipes, discount codes, shipping zones, store settings,
 * and a couple of sample orders so the dashboards aren't empty.
 *
 * Run with: npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { uuidv7, orderNumber } from "@/lib/id";
import { PREFECTURES } from "@/lib/shipping";
import { collectionPhoto, productPhotoAt, recipePhoto } from "./photos";

async function resetDatabase() {
  console.log("Clearing existing data…");
  const tables = [
    "audit_logs", "settings", "shipping_zones",
    "inquiries", "stock_alerts", "wishlists", "answers", "questions", "review_images", "reviews",
    "recipe_products", "recipes",
    "loyalty_ledger", "referrals", "subscription_items", "subscriptions",
    "discount_redemptions", "discounts", "refunds", "order_items", "orders",
    "cart_items", "carts", "addresses",
    "inventory_movements", "product_collections", "product_variants", "product_images", "products",
    "tags", "collections",
    "verification", "account", "session", "user",
  ];
  await db.execute(sql.raw(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} CASCADE;`));
}

async function seedUsers() {
  console.log("Seeding users…");
  async function createUser(email: string, name: string, role: "customer" | "staff" | "admin") {
    const res = await auth.api.signUpEmail({ body: { email, password: "password123", name } });
    await db.update(schema.user).set({ role }).where(eq(schema.user.id, res.user.id));
    return res.user.id;
  }

  const customerId = await createUser("customer@wholecuts.example", "Aiko Tanaka", "customer");
  const staffId = await createUser("staff@wholecuts.example", "Kenji Sato", "staff");
  const adminId = await createUser("admin@wholecuts.example", "Admin User", "admin");
  return { customerId, staffId, adminId };
}

const TAGS: Array<{ slug: string; en: string; ja: string; kind: string }> = [
  { slug: "grass-fed", en: "Grass-fed", ja: "牧草飼育", kind: "feed" },
  { slug: "grain-fed", en: "Grain-fed", ja: "穀物飼育", kind: "feed" },
  { slug: "organic", en: "Organic", ja: "オーガニック", kind: "feed" },
  { slug: "wagyu", en: "Wagyu", ja: "和牛", kind: "grade" },
  { slug: "prime", en: "Prime Grade", ja: "プライム", kind: "grade" },
  { slug: "australia", en: "Australia", ja: "オーストラリア産", kind: "origin" },
  { slug: "usa", en: "USA", ja: "アメリカ産", kind: "origin" },
  { slug: "new-zealand", en: "New Zealand", ja: "ニュージーランド産", kind: "origin" },
  { slug: "japan", en: "Japan", ja: "国産", kind: "origin" },
  { slug: "netherlands", en: "Netherlands", ja: "オランダ産", kind: "origin" },
  { slug: "spain", en: "Spain", ja: "スペイン産", kind: "origin" },
  { slug: "steaks", en: "Steaks", ja: "ステーキ", kind: "general" },
  { slug: "block-meats", en: "Block Meats", ja: "ブロック肉", kind: "general" },
  { slug: "new-arrival", en: "New Arrival", ja: "新着", kind: "general" },
];

type VariantSpec = { labelEn: string; labelJa: string; weightGrams: number; priceJpy: number; compareAtPriceJpy?: number; stock: number };

type ProductSpec = {
  slug: string;
  nameEn: string;
  nameJa: string;
  subtitleEn: string;
  subtitleJa: string;
  category: string;
  cut?: string;
  origin: string;
  feed?: string;
  grade?: string;
  tags: string[];
  descriptionEn: string;
  descriptionJa: string;
  cookingGuideEn: string;
  cookingGuideJa: string;
  variants: VariantSpec[];
  isNewArrival?: boolean;
  images?: number;
};

function weightVariants(
  brackets: Array<[number, number]>,
  pricePerKg: number,
  opts: { soldOutIndexes?: number[]; saleIndexes?: number[]; saleDiscountPct?: number } = {},
): VariantSpec[] {
  return brackets.map(([lo, hi], i) => {
    const mid = (lo + hi) / 2;
    const grams = Math.round(mid * 1000);
    const base = Math.round((pricePerKg * mid) / 10) * 10;
    const isSale = opts.saleIndexes?.includes(i);
    const price = isSale ? Math.round((base * (1 - (opts.saleDiscountPct ?? 10) / 100)) / 10) * 10 : base;
    return {
      labelEn: `${lo}Kg~${hi}Kg`,
      labelJa: `${lo}kg〜${hi}kg`,
      weightGrams: grams,
      priceJpy: price,
      compareAtPriceJpy: isSale ? base : undefined,
      stock: opts.soldOutIndexes?.includes(i) ? 0 : 15 + i * 3,
    };
  });
}

function fixedVariants(specs: Array<[string, string, number, number, number, number?]>): VariantSpec[] {
  // [labelEn, labelJa, grams, priceJpy, stock, compareAt?]
  return specs.map(([labelEn, labelJa, weightGrams, priceJpy, stock, compareAtPriceJpy]) => ({
    labelEn,
    labelJa,
    weightGrams,
    priceJpy,
    stock,
    compareAtPriceJpy,
  }));
}

const COOKING_STEAK_EN =
  "Rest at room temperature for 20–30 minutes before cooking. Sear in a hot, heavy pan or over charcoal for 2–3 minutes per side, then rest for 5 minutes before slicing. Target internal temperatures: rare 49°C, medium-rare 55°C, medium 60°C, medium-well 65°C.";
const COOKING_STEAK_JA =
  "調理前に20〜30分ほど室温に戻してください。よく熱したフライパンまたは炭火で片面2〜3分ずつ焼き、切る前に5分ほど休ませます。中心温度の目安：レア49℃、ミディアムレア55℃、ミディアム60℃、ミディアムウェル65℃。";
const COOKING_ROAST_EN =
  "Preheat the oven to 190°C. Sear all sides in a hot pan first, then roast until the thickest part reaches your target doneness (55°C for medium-rare). Rest, tented in foil, for at least 15 minutes before carving.";
const COOKING_ROAST_JA =
  "オーブンを190℃に予熱します。まず熱したフライパンで全面に焼き色をつけ、中心温度が目標（ミディアムレアなら55℃）に達するまでローストします。切り分ける前にアルミホイルをかけて15分以上休ませてください。";

const PRODUCTS: ProductSpec[] = [
  {
    slug: "ember-tomahawk-caveman-cut",
    nameEn: "Tomahawk Steak | Ember Caveman Cut",
    nameJa: "トマホークステーキ｜エンバー・ケイブマンカット",
    subtitleEn: "The showpiece cut — bone-in ribeye for sharing",
    subtitleJa: "骨付きリブアイのシェア向け看板カット",
    category: "beef",
    cut: "tomahawk",
    origin: "Australia",
    feed: "grass-fed",
    grade: "prime",
    tags: ["grass-fed", "australia", "prime", "steaks"],
    descriptionEn:
      "A full rack of ribeye left on the bone and frenched to a dramatic handle, the tomahawk is our most theatrical cut — built for slicing tableside and sharing across the table. Deep marbling, a rich crust, and enough drama for any occasion.",
    descriptionJa:
      "骨を残しフレンチカットに仕上げたリブアイの豪快な一枚。食卓で切り分けてシェアするための、まさに主役級のカットです。深いサシと香ばしい焼き色で特別な日にふさわしい一皿に。",
    cookingGuideEn: COOKING_ROAST_EN,
    cookingGuideJa: COOKING_ROAST_JA,
    variants: weightVariants(
      [[0.6, 0.8], [0.8, 1], [1, 1.25], [1.25, 1.5], [1.5, 1.75], [1.75, 2], [2, 2.25]],
      6800,
      { soldOutIndexes: [6] },
    ),
    images: 3,
  },
  {
    slug: "striploin-grass-fed-block",
    nameEn: "Sirloin Grass-Fed Beef Block — Striploin",
    nameJa: "牧草牛サーロインブロック",
    subtitleEn: "A whole striploin block for portioning at home",
    subtitleJa: "ご家庭でお好みの厚さにカットできるブロック",
    category: "beef",
    cut: "striploin",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "block-meats"],
    descriptionEn:
      "Cut your own steaks to the thickness you like. This whole striploin block is lean, firm-textured and full of clean grass-fed flavor — great value for anyone who cooks steak often.",
    descriptionJa:
      "お好みの厚さでステーキにカットできるサーロインのブロックです。赤身の旨みがしっかりとした牧草牛ならではの味わいで、ステーキをよく作るご家庭に人気です。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: weightVariants([[1, 1], [2, 2], [3, 3]], 4950),
    images: 2,
  },
  {
    slug: "cube-roll-rib-roast-true-aussie",
    nameEn: "Rib Roast Cube Roll Block, Grass-Fed | True Aussie Beef",
    nameJa: "牧草牛リブロースブロック｜トゥルー・アジー・ビーフ",
    subtitleEn: "The classic Sunday roast, bone-out",
    subtitleJa: "骨なしの定番ロースト用ブロック",
    category: "beef",
    cut: "rib-roast",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "block-meats"],
    descriptionEn:
      "The same rich, well-marbled muscle as a ribeye steak, left whole for roasting. A generous fat cap self-bastes the meat as it cooks — this is the roast that built Sunday dinners.",
    descriptionJa:
      "リブアイステーキと同じ部位をロースト用にブロックのまま仕上げました。厚い脂身が焼く間に肉を自然にバスティングし、極上のロースト料理に仕上がります。",
    cookingGuideEn: COOKING_ROAST_EN,
    cookingGuideJa: COOKING_ROAST_JA,
    variants: weightVariants([[1, 1], [1.5, 1.5], [2, 2]], 5930, { saleIndexes: [0, 1, 2], saleDiscountPct: 9 }),
    images: 2,
  },
  {
    slug: "grail-t-bone-steak",
    nameEn: "T-Bone Steak | The Grail of Meat",
    nameJa: "Tボーンステーキ｜肉の聖杯",
    subtitleEn: "Two cuts, one bone: strip and tenderloin",
    subtitleJa: "1本の骨にストリップとヒレの両方を",
    category: "beef",
    cut: "t-bone",
    origin: "USA",
    feed: "grain-fed",
    grade: "prime",
    tags: ["usa", "prime", "steaks"],
    descriptionEn:
      "The T-shaped bone divides two prized muscles — a robust strip loin on one side, a tender filet on the other. One steak, two textures, zero compromises.",
    descriptionJa:
      "T字の骨を挟んでストリップロインとヒレ肉という2つの部位が味わえる贅沢な一枚。1枚で2つの食感を楽しめます。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: weightVariants([[0.35, 0.45], [0.45, 0.55], [0.55, 0.65]], 4200),
    images: 2,
  },
  {
    slug: "brisket-grass-fed-whole",
    nameEn: "Beef Brisket, Grass-Fed",
    nameJa: "牧草牛ブリスケット",
    subtitleEn: "Low and slow, made for smoking",
    subtitleJa: "じっくり燻製・煮込みに最適",
    category: "beef",
    cut: "brisket",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "block-meats"],
    descriptionEn:
      "A full brisket with point and flat intact — the cut that rewards patience. Smoke it for twelve hours or braise it into a Sunday stew; either way, it falls apart in the best way.",
    descriptionJa:
      "ポイントとフラットが一体になったブリスケット丸ごと一枚。じっくり時間をかけることでホロホロにほぐれる、燻製や煮込みに最適な部位です。",
    cookingGuideEn:
      "Season generously and smoke at 110°C until the internal temperature reaches 96°C, about 1 hour per 500g. Wrap in butcher paper once the bark sets. Rest for at least 30 minutes before slicing against the grain.",
    cookingGuideJa:
      "たっぷりと下味をつけ、110℃で中心温度が96℃になるまで燻製にします（目安：500gあたり約1時間）。表面に焼き色がついたら紙で包み、切る前に30分以上休ませ、繊維を断つように切り分けてください。",
    variants: weightVariants([[1, 1.5], [1.5, 2], [2, 2.5], [2.5, 3]], 4790),
    images: 2,
  },
  {
    slug: "sirloin-rib-roast-block-set",
    nameEn: "Sirloin & Rib Roast 2kg Block Set (2 pcs)",
    nameJa: "サーロイン＆リブロース 2kgブロックセット（2点）",
    subtitleEn: "Our two best-selling roasts, bundled",
    subtitleJa: "人気の2部位をセットでお得に",
    category: "beef",
    cut: "assorted",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "block-meats"],
    descriptionEn:
      "One striploin block and one rib roast block, 1kg each — a value bundle for anyone stocking a freezer for the season.",
    descriptionJa:
      "サーロインとリブロースのブロックを1kgずつセットにしたお得な商品です。まとめ買いにおすすめ。",
    cookingGuideEn: COOKING_ROAST_EN,
    cookingGuideJa: COOKING_ROAST_JA,
    variants: fixedVariants([["2Kg Set", "2kgセット", 2000, 14250, 10]]),
    images: 1,
  },
  {
    slug: "filet-mignon-tenderloin",
    nameEn: "Filet Mignon Tenderloin, Grass-Fed (500g)",
    nameJa: "牧草牛フィレミニョン・ヒレ肉（500g）",
    subtitleEn: "The leanest, most tender cut on the animal",
    subtitleJa: "最も柔らかい部位、ヒレ肉",
    category: "beef",
    cut: "tenderloin",
    origin: "New Zealand",
    feed: "grass-fed",
    tags: ["grass-fed", "new-zealand", "steaks"],
    descriptionEn: "Butter-knife tender with a mild, clean flavor — the classic centerpiece for a special dinner.",
    descriptionJa: "バターナイフでも切れるほど柔らかく、上品な味わい。特別な日のメインディッシュに。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["500g", "500g", 500, 7490, 12]]),
    images: 1,
  },
  {
    slug: "chuck-eye-steak",
    nameEn: "Chuck Eye Steak (about 500g)",
    nameJa: "チャックアイステーキ（約500g）",
    subtitleEn: "The \"poor man's ribeye\" — same muscle, better price",
    subtitleJa: "リブアイに近い部位をお手頃価格で",
    category: "beef",
    cut: "chuck-eye",
    origin: "USA",
    feed: "grain-fed",
    tags: ["usa", "steaks"],
    descriptionEn: "Cut from right next to the ribeye, the chuck eye delivers similar marbling and flavor for a friendlier price.",
    descriptionJa: "リブアイのすぐ隣から切り出される部位で、近い旨みとサシをお手頃な価格で楽しめます。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["500g", "500g", 500, 2780, 0]]),
    images: 1,
  },
  {
    slug: "flank-steak-big-size",
    nameEn: "Flank Steak, Australian Beef | Big Size",
    nameJa: "オーストラリア産フランクステーキ｜ビッグサイズ",
    subtitleEn: "Loves a marinade, perfect for stir-fry and fajitas",
    subtitleJa: "漬け込みや炒め物、ファヒータに最適",
    category: "beef",
    cut: "flank",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia"],
    descriptionEn: "A long, fibrous cut that soaks up marinades beautifully and stays tender when sliced thin against the grain.",
    descriptionJa: "繊維に沿って長く、マリネがよく染み込む部位。薄く繊維を断ち切って切ることで柔らかく仕上がります。",
    cookingGuideEn: "Marinate for at least 2 hours. Grill hot and fast, 4–5 minutes per side for medium-rare, then slice thinly against the grain.",
    cookingGuideJa: "最低2時間はマリネしてください。強火で片面4〜5分ずつ焼き、繊維を断ち切るように薄くスライスします。",
    variants: weightVariants([[0.8, 1], [1, 1.2]], 4790),
    images: 1,
  },
  {
    slug: "ribeye-extra-thick",
    nameEn: "Ribeye Steak, Grass-Fed, Extra Thick (300g)",
    nameJa: "牧草牛リブアイステーキ 厚切り（300g）",
    subtitleEn: "Our most popular everyday steak",
    subtitleJa: "定番人気のステーキ肉",
    category: "beef",
    cut: "ribeye",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "steaks"],
    descriptionEn: "Generously marbled and cut extra thick for a proper sear-to-center contrast. The steak we recommend to first-time customers.",
    descriptionJa: "しっかりとしたサシが入った厚切りリブアイ。外は香ばしく中はジューシーに仕上がる、初めての方にもおすすめの一枚です。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: weightVariants([[0.3, 0.3], [0.6, 0.6]], 5300),
    isNewArrival: true,
    images: 2,
  },
  {
    slug: "strip-steak-sirloin-250g",
    nameEn: "Strip Steak, Grass-Fed Beef Sirloin (250g)",
    nameJa: "牧草牛サーロインステーキ（250g）",
    subtitleEn: "A firmer bite with a clean beefy flavor",
    subtitleJa: "しっかりとした食感と旨み",
    category: "beef",
    cut: "sirloin",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "steaks"],
    descriptionEn: "A single-portion sirloin steak, well suited to a weeknight pan-sear.",
    descriptionJa: "1人分にちょうど良いサーロインステーキ。平日のディナーにも手軽に。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["250g", "250g", 250, 1890, 20]]),
    images: 1,
  },
  {
    slug: "rump-steak-250g",
    nameEn: "Rump Beef Steak (250g)",
    nameJa: "ランプステーキ（250g）",
    subtitleEn: "Lean, affordable, and full of flavor",
    subtitleJa: "赤身でお財布にも優しい一枚",
    category: "beef",
    cut: "rump",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia"],
    descriptionEn: "A lean, well-priced steak from the rump — great for everyday cooking.",
    descriptionJa: "ランプ部位を使用した赤身のステーキ。日常使いにぴったりの価格帯です。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["250g", "250g", 250, 1650, 0]]),
    images: 1,
  },
  {
    slug: "aitchbone-ichibo-block",
    nameEn: "Aitchbone (Ichibo) Block, Grain-Fed Australia, 1kg",
    nameJa: "イチボブロック 穀物飼育オーストラリア産 1kg",
    subtitleEn: "A hidden gem: tender with a delicate fat marbling",
    subtitleJa: "知る人ぞ知る、上質なサシと柔らかさ",
    category: "beef",
    cut: "aitchbone",
    origin: "Australia",
    feed: "grain-fed",
    tags: ["australia", "block-meats"],
    descriptionEn: "Ichibo (aitchbone) is prized in Japanese yakiniku for its balance of tenderness and marbling — a versatile block for steaks or thin-sliced grilling.",
    descriptionJa: "焼肉でも人気のイチボは、柔らかさと程よいサシのバランスが魅力。ステーキにも薄切り焼肉にも使える万能ブロックです。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["1Kg", "1kg", 1000, 6980, 8]]),
    images: 1,
  },
  {
    slug: "organic-oyster-spider-steak",
    nameEn: "Organic Beef Oyster (Spider) Steak, Bone-Aged",
    nameJa: "オーガニックビーフ オイスターステーキ（スパイダーステーキ）骨熟成",
    subtitleEn: "A rare, richly marbled cut from near the hip",
    subtitleJa: "希少な部位を骨付きのまま熟成",
    category: "beef",
    cut: "oyster-steak",
    origin: "Austria",
    feed: "organic",
    tags: ["organic"],
    descriptionEn: "A small, richly marbled muscle from the hip area, bone-aged for extra depth of flavor. Limited quantities.",
    descriptionJa: "腰の部分にあるごく少量しか取れない希少部位。骨付き熟成でより深い旨みに仕上げています。数量限定。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["Approx. 300g", "約300g", 300, 2390, 0]]),
    images: 1,
  },
  {
    slug: "extra-thick-aitchbone-steak",
    nameEn: "Extra-Thick Aitchbone (Ichibo) Steak",
    nameJa: "厚切りイチボステーキ",
    subtitleEn: "Cut thick for a proper medium-rare center",
    subtitleJa: "厚切りでミディアムレアに仕上がる一枚",
    category: "beef",
    cut: "aitchbone",
    origin: "Australia",
    feed: "grain-fed",
    tags: ["australia", "steaks"],
    descriptionEn: "The same prized ichibo, portioned thick for steak night.",
    descriptionJa: "人気のイチボをステーキ用に厚切りでご用意しました。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["280g", "280g", 280, 1490, 0]]),
    images: 1,
  },
  {
    slug: "yakiniku-slices-1kg",
    nameEn: "Yakiniku Slices, Australian Beef (1kg)",
    nameJa: "オーストラリア産 焼肉スライス（1kg）",
    subtitleEn: "Thin-sliced and ready for the grill",
    subtitleJa: "そのままグリルできる薄切りスライス",
    category: "beef",
    cut: "assorted",
    origin: "Australia",
    feed: "grain-fed",
    tags: ["australia"],
    descriptionEn: "Pre-sliced yakiniku-style beef, ready straight from the freezer to the grill.",
    descriptionJa: "冷凍のままグリルに使える、焼肉用にスライス済みのお肉です。",
    cookingGuideEn: "Grill quickly over high heat, a minute or so per side. Great with a simple tare or salt and citrus.",
    cookingGuideJa: "強火でさっと両面1分ほど焼くだけ。タレはもちろん、塩と柑橘だけでも美味しくいただけます。",
    variants: fixedVariants([["1Kg", "1kg", 1000, 4580, 0]]),
    images: 1,
  },
  {
    slug: "raw-beef-patty-6pack",
    nameEn: "Raw Beef Patty 110g x 6 | Ready to Cook",
    nameJa: "生ビーフパティ 110g×6個｜そのまま調理可能",
    subtitleEn: "Individually frozen, straight to the pan or grill",
    subtitleJa: "1個ずつ個包装、フライパンやグリルにそのまま",
    category: "beef",
    cut: "ground",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia"],
    descriptionEn: "Six individually frozen 110g patties made from coarsely ground grass-fed beef — no fillers, just meat.",
    descriptionJa: "牧草牛の粗挽き肉のみで作った110gパティを6個、1個ずつ個包装で冷凍しました。つなぎ不使用。",
    cookingGuideEn: "Cook from frozen or thawed, 4 minutes per side over medium-high heat for a juicy medium doneness.",
    cookingGuideJa: "冷凍のままでも解凍してもOK。中火強で片面4分ずつ焼くとジューシーなミディアムに仕上がります。",
    variants: fixedVariants([["110g x 6", "110g×6", 660, 2590, 25]]),
    isNewArrival: true,
    images: 1,
  },
  {
    slug: "premium-op-rib-steak",
    nameEn: "Premium OP Rib Steak | Gorgeous Marbling",
    nameJa: "プレミアムOPリブステーキ｜極上のサシ",
    subtitleEn: "Outside the plate — heavily marbled and rich",
    subtitleJa: "サシがたっぷり入った濃厚な味わい",
    category: "beef",
    cut: "op-rib",
    origin: "USA",
    feed: "grain-fed",
    grade: "prime",
    tags: ["usa", "prime", "steaks"],
    descriptionEn: "Cut from outside the rib plate, this steak carries some of the heaviest marbling on the animal.",
    descriptionJa: "リブプレートの外側から切り出した、動物の中でも特にサシの入った部位です。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["400g", "400g", 400, 5000, 0]]),
    images: 1,
  },
  {
    slug: "veal-trimmings-netherlands",
    nameEn: "Veal Trimmings 0.8–1.1kg | Netherlands",
    nameJa: "仔牛トリミング 0.8〜1.1kg｜オランダ産",
    subtitleEn: "Milk-fed veal, perfect for stock and stews",
    subtitleJa: "出汁や煮込み料理に最適な仔牛肉",
    category: "beef",
    cut: "trimmings",
    origin: "Netherlands",
    feed: "grain-fed",
    tags: ["netherlands"],
    descriptionEn: "Delicate, mild-flavored veal trimmings sourced from the Netherlands — ideal for stocks, ragù, and slow braises.",
    descriptionJa: "オランダ産の上品でクセの少ない仔牛肉。出汁やラグー、煮込み料理に最適です。",
    cookingGuideEn: "Braise low and slow, 2.5–3 hours, or simmer for a light, clean stock.",
    cookingGuideJa: "2.5〜3時間ほど弱火でじっくり煮込むか、あっさりとした出汁に。",
    variants: fixedVariants([["0.8–1.1kg", "0.8〜1.1kg", 950, 3000, 6]]),
    images: 1,
  },
  {
    slug: "thick-skirt-slices-nz",
    nameEn: "Thick Skirt Slices 250g x 4 (1kg) | New Zealand Beef",
    nameJa: "厚切りスカートスライス 250g×4（1kg）｜ニュージーランド産",
    subtitleEn: "Bold beef flavor, perfect for the grill",
    subtitleJa: "力強い旨みでグリルに最適",
    category: "beef",
    cut: "skirt",
    origin: "New Zealand",
    feed: "grass-fed",
    tags: ["grass-fed", "new-zealand"],
    descriptionEn: "Four individually portioned skirt steaks with big, beefy flavor. Grill hot and fast.",
    descriptionJa: "力強い旨みが特徴のスカートステーキを4枚に個包装。強火で手早く焼き上げてください。",
    cookingGuideEn: "Grill 3–4 minutes per side over high heat. Slice thinly against the grain to serve.",
    cookingGuideJa: "強火で片面3〜4分焼きます。提供時は繊維を断ち切るように薄くスライスしてください。",
    variants: fixedVariants([["250g x 4", "250g×4", 1000, 3980, 10]]),
    images: 1,
  },
  {
    slug: "milk-fed-veal-bones",
    nameEn: "Milk-Fed Veal Bones 1kg+ | Great for Soup & Stock",
    nameJa: "仔牛骨 1kg以上｜スープ・出汁に最適",
    subtitleEn: "May contain bone marrow",
    subtitleJa: "骨髄が含まれる場合があります",
    category: "beef",
    cut: "bones",
    origin: "Netherlands",
    tags: ["netherlands"],
    descriptionEn: "Veal bones for a clean, gelatin-rich stock. Roast first for extra depth of flavor.",
    descriptionJa: "澄んだコクのある出汁が取れる仔牛の骨です。ローストしてから煮出すとより深みが増します。",
    cookingGuideEn: "Roast at 200°C for 40 minutes, then simmer with aromatics for 6–12 hours.",
    cookingGuideJa: "200℃で40分ローストしてから、香味野菜と一緒に6〜12時間煮出してください。",
    variants: fixedVariants([["1Kg+", "1kg以上", 1000, 1590, 14]]),
    images: 1,
  },
  {
    slug: "l-bone-steak",
    nameEn: "Beef L-Bone Steak",
    nameJa: "Lボーンステーキ",
    subtitleEn: "A T-bone's leaner cousin",
    subtitleJa: "Tボーンに似た赤身寄りの一枚",
    category: "beef",
    cut: "l-bone",
    origin: "Australia",
    feed: "grass-fed",
    tags: ["grass-fed", "australia", "steaks"],
    descriptionEn: "Similar to a T-bone but with a smaller tenderloin section — a leaner, budget-friendly bone-in steak.",
    descriptionJa: "Tボーンに似ていますがヒレの部分が小さめの、赤身寄りでお手頃なボーンインステーキです。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: weightVariants([[0.35, 0.45], [0.45, 0.55]], 3200, { saleIndexes: [0, 1], saleDiscountPct: 35 }),
    images: 1,
  },
  {
    slug: "3x-t-bone-us-choice",
    nameEn: "3x T-Bone Steak, US Choice (1.2–1.5kg)",
    nameJa: "Tボーンステーキ 3枚セット US Choice（1.2〜1.5kg）",
    subtitleEn: "A family pack of our Grail cut",
    subtitleJa: "人気のTボーンをファミリーパックで",
    category: "beef",
    cut: "t-bone",
    origin: "USA",
    feed: "grain-fed",
    tags: ["usa", "steaks"],
    descriptionEn: "Three US Choice T-bone steaks bundled together — great for a backyard cookout.",
    descriptionJa: "US Choiceグレードのtボーンステーキを3枚セットに。バーベキューにぴったりです。",
    cookingGuideEn: COOKING_STEAK_EN,
    cookingGuideJa: COOKING_STEAK_JA,
    variants: fixedVariants([["3 pcs (1.2–1.5kg)", "3枚（1.2〜1.5kg）", 1350, 7870, 0]]),
    images: 1,
  },
  {
    slug: "beef-tongue-heavenly-tender",
    nameEn: "Beef Tongue | Heavenly Tender",
    nameJa: "牛タン｜とろける柔らかさ",
    subtitleEn: "A yakiniku classic",
    subtitleJa: "焼肉の定番部位",
    category: "beef",
    cut: "tongue",
    origin: "Australia",
    tags: ["australia"],
    descriptionEn: "Whole beef tongue, cleaned and ready to slice — a yakiniku-counter favorite at home.",
    descriptionJa: "下処理済みの牛タンをそのままご自宅で。焼肉店の人気メニューをご家庭でも。",
    cookingGuideEn: "Slice thinly and grill 1–2 minutes per side. Finish with lemon and salt, or a squeeze of citrus.",
    cookingGuideJa: "薄切りにして片面1〜2分ずつ焼きます。塩とレモンでシンプルに仕上げるのがおすすめです。",
    variants: weightVariants([[0.4, 0.6], [0.6, 0.8]], 6200),
    images: 1,
  },
  {
    slug: "wagyu-a5-sirloin",
    nameEn: "Japanese A5 Wagyu Sirloin",
    nameJa: "国産A5和牛サーロイン",
    subtitleEn: "Exceptional marbling, melt-in-the-mouth texture",
    subtitleJa: "とろけるような口当たりの極上サシ",
    category: "beef",
    cut: "sirloin",
    origin: "Japan",
    grade: "wagyu",
    tags: ["japan", "wagyu"],
    descriptionEn: "Certified A5 Wagyu sirloin from Japan — snowflake marbling that melts at room temperature. Best served in small, thin-cut portions.",
    descriptionJa: "格付A5等級の国産和牛サーロイン。雪のようなサシは常温でも溶けるほど。薄切りで少量ずついただくのがおすすめです。",
    cookingGuideEn: "Sear 30–45 seconds per side in a very hot pan with no added oil — the fat will render on its own. Rest briefly and slice thin.",
    cookingGuideJa: "油をひかずに熱したフライパンで片面30〜45秒ずつ焼きます。脂は自然に溶け出します。少し休ませてから薄くスライスしてください。",
    variants: weightVariants([[0.2, 0.2], [0.4, 0.4]], 24000),
    isNewArrival: true,
    images: 2,
  },
  {
    slug: "wagyu-a5-ribeye-block",
    nameEn: "Japanese A5 Wagyu Ribeye Block",
    nameJa: "国産A5和牛リブロースブロック",
    subtitleEn: "For the most special of occasions",
    subtitleJa: "特別な日のための逸品",
    category: "beef",
    cut: "ribeye",
    origin: "Japan",
    grade: "wagyu",
    tags: ["japan", "wagyu", "block-meats"],
    descriptionEn: "A whole A5 Wagyu ribeye block for slicing into shabu-shabu, sukiyaki, or thick-cut steaks.",
    descriptionJa: "しゃぶしゃぶやすき焼き、厚切りステーキにも使えるA5和牛リブロースのブロックです。",
    cookingGuideEn: "For steaks, sear briefly and rest. For shabu-shabu, freeze slightly and slice paper-thin.",
    cookingGuideJa: "ステーキの場合は短時間で焼いて休ませます。しゃぶしゃぶの場合は少し凍らせてから薄くスライスしてください。",
    variants: fixedVariants([["500g", "500g", 500, 18000, 4]]),
    isNewArrival: true,
    images: 1,
  },
  // Other Meats (lamb, kangaroo, game)
  {
    slug: "lamb-rack-frenched",
    nameEn: "Frenched Lamb Rack, New Zealand",
    nameJa: "ニュージーランド産 ラムラック（フレンチカット）",
    subtitleEn: "Restaurant-style presentation, home-easy cooking",
    subtitleJa: "レストランのような見た目、調理は簡単",
    category: "other-meats",
    cut: "rack",
    origin: "New Zealand",
    feed: "grass-fed",
    tags: ["grass-fed", "new-zealand"],
    descriptionEn: "A frenched 8-bone lamb rack — elegant, quick to cook, and consistently tender.",
    descriptionJa: "骨をきれいに整えた8本のラムラック。見た目も華やかで、火の通りも早く柔らかな仕上がりです。",
    cookingGuideEn: "Sear all sides, then roast at 200°C for 12–15 minutes for medium-rare. Rest 10 minutes before carving between the bones.",
    cookingGuideJa: "全面を焼き付けてから200℃で12〜15分ローストするとミディアムレアに仕上がります。骨に沿って切り分ける前に10分休ませてください。",
    variants: fixedVariants([["Approx. 400g", "約400g", 400, 4980, 8]]),
    images: 1,
  },
  {
    slug: "lamb-leg-boneless",
    nameEn: "Boneless Lamb Leg, New Zealand (approx. 1.8kg)",
    nameJa: "ニュージーランド産 骨なしラム モモ肉（約1.8kg）",
    subtitleEn: "A showstopping roast for a crowd",
    subtitleJa: "大人数にもぴったりのローストに",
    category: "other-meats",
    cut: "leg",
    origin: "New Zealand",
    feed: "grass-fed",
    tags: ["grass-fed", "new-zealand", "block-meats"],
    descriptionEn: "A butterflied, boneless leg of lamb — easy to season, roast, or grill whole.",
    descriptionJa: "骨を抜いて開いたラムのモモ肉。下味をつけてロースト、またはグリルで丸ごと調理できます。",
    cookingGuideEn: COOKING_ROAST_EN,
    cookingGuideJa: COOKING_ROAST_JA,
    variants: fixedVariants([["Approx. 1.8Kg", "約1.8kg", 1800, 7480, 6]]),
    images: 1,
  },
  {
    slug: "kangaroo-fillet",
    nameEn: "Kangaroo Fillet, Australia (400g)",
    nameJa: "オーストラリア産 カンガルーフィレ（400g）",
    subtitleEn: "Extremely lean, rich, gamey flavor",
    subtitleJa: "低脂肪で濃厚なジビエの味わい",
    category: "other-meats",
    cut: "fillet",
    origin: "Australia",
    tags: ["australia"],
    descriptionEn: "Wild-harvested kangaroo fillet — one of the leanest red meats available, with a deep, iron-rich flavor. Best served rare to medium-rare.",
    descriptionJa: "野生のカンガルー肉のフィレ。赤身肉の中でも特に低脂肪で、鉄分を感じる濃厚な味わいです。レア〜ミディアムレアがおすすめ。",
    cookingGuideEn: "Sear 90 seconds per side over high heat; overcooking will toughen it quickly. Rest before slicing thin.",
    cookingGuideJa: "強火で片面90秒ほど焼きます。火を通しすぎると硬くなるのでご注意ください。薄切りにする前に休ませてください。",
    variants: fixedVariants([["400g", "400g", 400, 2980, 10]]),
    isNewArrival: true,
    images: 1,
  },
  {
    slug: "duck-breast-magret",
    nameEn: "Duck Breast Magret, France",
    nameJa: "フランス産 鴨胸肉（マグレ）",
    subtitleEn: "Rich, fatty skin and deep red meat",
    subtitleJa: "厚い脂と濃厚な赤身",
    category: "other-meats",
    cut: "breast",
    origin: "France",
    tags: [],
    descriptionEn: "A classic magret de canard — score the fat cap and render it slowly for a crisp, golden skin.",
    descriptionJa: "定番のマグレ・ド・カナール。皮目に切り込みを入れてじっくり脂を落とすとパリッと黄金色に仕上がります。",
    cookingGuideEn: "Score the skin, start in a cold pan, render fat over medium heat for 8 minutes, flip and cook 3–4 minutes more for medium-rare.",
    cookingGuideJa: "皮目に切り込みを入れ、冷たいフライパンから中火で8分ほど脂を落とし、裏返してさらに3〜4分焼くとミディアムレアに。",
    variants: fixedVariants([["Approx. 350g", "約350g", 350, 3280, 7]]),
    images: 1,
  },
  // Charcuterie
  {
    slug: "iberico-chorizo",
    nameEn: "Ibérico Chorizo, Spain (200g)",
    nameJa: "イベリコ・チョリソ（200g）",
    subtitleEn: "Smoky, paprika-spiced dry sausage",
    subtitleJa: "パプリカの香るスモーキーなドライソーセージ",
    category: "charcuterie",
    origin: "Spain",
    tags: ["spain"],
    descriptionEn: "Traditional Spanish dry-cured chorizo, seasoned with smoked paprika.",
    descriptionJa: "スモークパプリカが香る伝統的なスペイン産ドライチョリソです。",
    cookingGuideEn: "Slice thin and serve as-is, or pan-fry for a few minutes to render the fat.",
    cookingGuideJa: "薄切りでそのままお召し上がりいただくか、軽く炒めて脂を出してもおいしくいただけます。",
    variants: fixedVariants([["200g", "200g", 200, 1780, 15]]),
    images: 1,
  },
  {
    slug: "prosciutto-crudo-sliced",
    nameEn: "Prosciutto Crudo, Sliced (100g)",
    nameJa: "生ハム プロシュート スライス（100g）",
    subtitleEn: "18-month aged Italian dry-cured ham",
    subtitleJa: "18ヶ月熟成のイタリア産生ハム",
    category: "charcuterie",
    origin: "Italy",
    tags: [],
    descriptionEn: "Delicately sweet, aged 18 months — perfect with melon, on a cheese board, or wrapped around breadsticks.",
    descriptionJa: "18ヶ月熟成させた上品な甘みの生ハム。メロンやチーズボード、グリッシーニに巻いても。",
    cookingGuideEn: "Serve at room temperature, straight from the pack.",
    cookingGuideJa: "常温に戻してそのままお召し上がりください。",
    variants: fixedVariants([["100g", "100g", 100, 1580, 20]]),
    images: 1,
  },
  {
    slug: "bratwurst-6pack",
    nameEn: "German Bratwurst, 6-Pack (approx. 480g)",
    nameJa: "ドイツ産 ブラートヴルスト 6本セット（約480g）",
    subtitleEn: "Classic German sausage, ready to grill",
    subtitleJa: "定番のドイツ風ソーセージ、そのままグリルへ",
    category: "charcuterie",
    origin: "Germany",
    tags: [],
    descriptionEn: "Traditional German-style bratwurst, coarsely ground and lightly seasoned.",
    descriptionJa: "粗挽きであっさりとした味付けの伝統的なドイツ風ソーセージです。",
    cookingGuideEn: "Grill or pan-fry 12–15 minutes over medium heat, turning occasionally.",
    cookingGuideJa: "中火で12〜15分、時々転がしながらグリルまたはフライパンで焼いてください。",
    variants: fixedVariants([["6 pcs, approx. 480g", "6本 約480g", 480, 1980, 18]]),
    images: 1,
  },
  {
    slug: "pate-de-campagne",
    nameEn: "Pâté de Campagne (180g)",
    nameJa: "パテ・ド・カンパーニュ（180g）",
    subtitleEn: "Rustic French country pâté",
    subtitleJa: "素朴なフランスの田舎風パテ",
    category: "charcuterie",
    origin: "France",
    tags: [],
    descriptionEn: "A coarse, rustic country-style pâté with herbs and a touch of brandy.",
    descriptionJa: "ハーブと少量のブランデーを使った素朴な田舎風パテです。",
    cookingGuideEn: "Serve chilled or at room temperature with crusty bread and cornichons.",
    cookingGuideJa: "冷やすか常温で、バゲットとコルニッションを添えてお召し上がりください。",
    variants: fixedVariants([["180g", "180g", 180, 1480, 12]]),
    images: 1,
  },
  {
    slug: "smoked-bacon-block",
    nameEn: "Smoked Bacon Block (300g)",
    nameJa: "スモークベーコンブロック（300g）",
    subtitleEn: "Slice it as thick or thin as you like",
    subtitleJa: "お好みの厚さにカットして",
    category: "charcuterie",
    origin: "Spain",
    tags: ["spain"],
    descriptionEn: "Oak-smoked bacon in a block, so you can cut it to whatever thickness the recipe calls for.",
    descriptionJa: "オーク材でスモークしたベーコンをブロックで。レシピに合わせてお好みの厚さにカットできます。",
    cookingGuideEn: "Pan-fry over medium heat until crisp, about 3–4 minutes per side depending on thickness.",
    cookingGuideJa: "中火でカリッとするまで、厚さに応じて片面3〜4分ほど焼いてください。",
    variants: fixedVariants([["300g", "300g", 300, 1680, 16]]),
    images: 1,
  },
  // Spices & Herbs
  {
    slug: "steak-house-rub",
    nameEn: "Steak House Spice Rub (120g)",
    nameJa: "ステーキハウス スパイスラブ（120g）",
    subtitleEn: "Our house blend — coarse salt, pepper & garlic",
    subtitleJa: "粗塩・胡椒・ガーリックの自家製ブレンド",
    category: "spices",
    origin: "Japan",
    tags: ["japan"],
    descriptionEn: "The same coarse salt-and-pepper blend we use in-house, with roasted garlic and a hint of smoked paprika.",
    descriptionJa: "店内でも使用している粗塩胡椒ベースのブレンドに、ローストガーリックとスモークパプリカを効かせました。",
    cookingGuideEn: "Apply generously 30 minutes before cooking for the best crust.",
    cookingGuideJa: "調理の30分前にたっぷりとまぶすと、より香ばしい焼き色に仕上がります。",
    variants: fixedVariants([["120g", "120g", 120, 980, 40]]),
    images: 1,
  },
  {
    slug: "smoked-paprika-tin",
    nameEn: "Smoked Paprika, Spanish (75g tin)",
    nameJa: "スペイン産スモークパプリカ（75g缶）",
    subtitleEn: "Deep, smoky sweetness for rubs and stews",
    subtitleJa: "ラブや煮込みに深みのある燻製の甘み",
    category: "spices",
    origin: "Spain",
    tags: ["spain"],
    descriptionEn: "Traditional Spanish pimentón, smoked over oak — essential for chorizo-style seasoning and stews.",
    descriptionJa: "オーク材で燻製した伝統的なスペイン産パプリカパウダー。チョリソ風の味付けや煮込みに欠かせません。",
    cookingGuideEn: "A little goes a long way — start with a teaspoon and adjust to taste.",
    cookingGuideJa: "少量でも香りが強いので、まずは小さじ1杯からお試しください。",
    variants: fixedVariants([["75g tin", "75g缶", 75, 780, 30]]),
    images: 1,
  },
  {
    slug: "herbes-de-provence",
    nameEn: "Herbes de Provence (40g)",
    nameJa: "エルブ・ド・プロヴァンス（40g）",
    subtitleEn: "Thyme, rosemary, oregano & lavender blend",
    subtitleJa: "タイム・ローズマリー・オレガノ・ラベンダーのブレンド",
    category: "spices",
    origin: "France",
    tags: [],
    descriptionEn: "A fragrant, classic blend for roasted lamb, chicken, and root vegetables.",
    descriptionJa: "ラムやチキン、根菜のローストに香り高く仕上がる定番のハーブブレンドです。",
    cookingGuideEn: "Rub onto meat before roasting, or add to a marinade.",
    cookingGuideJa: "ロースト前にお肉にすり込むか、マリネ液に加えてお使いください。",
    variants: fixedVariants([["40g", "40g", 40, 890, 35]]),
    images: 1,
  },
  {
    slug: "finishing-sea-salt",
    nameEn: "Flaky Finishing Sea Salt (100g)",
    nameJa: "仕上げ用フレークソルト（100g）",
    subtitleEn: "For the final crunch on a rested steak",
    subtitleJa: "焼き上げたステーキの仕上げに",
    category: "spices",
    origin: "Australia",
    tags: ["australia"],
    descriptionEn: "Light, crunchy sea salt flakes — sprinkle just before serving for texture and a clean, briny finish.",
    descriptionJa: "軽くカリッとした食感のフレークソルト。提供直前に振りかけることで食感と塩味の余韻が引き立ちます。",
    cookingGuideEn: "Finish, don't cook with it — sprinkle right before serving.",
    cookingGuideJa: "調理には使わず、提供直前に振りかけてお使いください。",
    variants: fixedVariants([["100g", "100g", 100, 680, 45]]),
    images: 1,
  },
  // Other Frozen
  {
    slug: "beef-bone-broth-frozen",
    nameEn: "Beef Bone Broth, Frozen (500ml)",
    nameJa: "ビーフボーンブロス 冷凍（500ml）",
    subtitleEn: "24-hour simmered, ready to heat",
    subtitleJa: "24時間煮込み済み、温めるだけ",
    category: "frozen",
    origin: "Japan",
    tags: ["japan"],
    descriptionEn: "A rich, collagen-forward bone broth simmered for 24 hours from our own beef bones. Thaw and heat.",
    descriptionJa: "自社の牛骨を24時間煮込んだコラーゲン豊富な濃厚ボーンブロス。解凍して温めるだけです。",
    cookingGuideEn: "Thaw overnight in the fridge, then heat gently on the stove.",
    cookingGuideJa: "冷蔵庫で一晩解凍し、弱火でゆっくり温めてください。",
    variants: fixedVariants([["500ml", "500ml", 500, 1280, 25]]),
    images: 1,
  },
  {
    slug: "demi-glace-frozen",
    nameEn: "Classic Demi-Glace, Frozen (300ml)",
    nameJa: "クラシック・ドミグラスソース 冷凍（300ml）",
    subtitleEn: "Restaurant-grade sauce base",
    subtitleJa: "レストラン品質のソースベース",
    category: "frozen",
    origin: "Japan",
    tags: ["japan"],
    descriptionEn: "A rich, glossy demi-glace made in small batches — the base for an excellent steak sauce or braise.",
    descriptionJa: "少量ずつ丁寧に仕込んだ、艶やかで濃厚なドミグラスソース。ステーキソースや煮込み料理のベースに。",
    cookingGuideEn: "Thaw and gently reduce with red wine or cream to finish.",
    cookingGuideJa: "解凍後、赤ワインや生クリームを加えて軽く煮詰めて仕上げてください。",
    variants: fixedVariants([["300ml", "300ml", 300, 1580, 20]]),
    images: 1,
  },
  {
    slug: "garlic-herb-butter-frozen",
    nameEn: "Garlic Herb Compound Butter, Frozen (150g)",
    nameJa: "ガーリックハーブ・コンパウンドバター 冷凍（150g）",
    subtitleEn: "Slice a coin onto a hot steak and let it melt",
    subtitleJa: "焼きたてのステーキに乗せて溶かすだけ",
    category: "frozen",
    origin: "Japan",
    tags: ["japan"],
    descriptionEn: "Butter blended with roasted garlic and fresh herbs, rolled and frozen for easy slicing.",
    descriptionJa: "ローストガーリックとフレッシュハーブを練り込んだバターを棒状に成形して冷凍しました。",
    cookingGuideEn: "Slice a coin while frozen and place on a freshly rested steak.",
    cookingGuideJa: "凍ったまま輪切りにし、焼き上がったステーキの上に乗せてください。",
    variants: fixedVariants([["150g", "150g", 150, 980, 30]]),
    isNewArrival: true,
    images: 1,
  },
];

const RECIPES = [
  {
    slug: "reverse-seared-tomahawk",
    titleEn: "Reverse-Seared Tomahawk for Two",
    titleJa: "2人分の逆さ焼きトマホークステーキ",
    excerptEn: "Low oven, then a screaming-hot sear — the most reliable way to nail a thick steak.",
    excerptJa: "低温オーブンの後に高温で焼き上げる、厚切りステーキを失敗しない焼き方。",
    category: "oven",
    cookTimeMinutes: 90,
    difficulty: "medium",
    servings: 2,
    productSlugs: ["ember-tomahawk-caveman-cut", "finishing-sea-salt"],
  },
  {
    slug: "grass-fed-striploin-chimichurri",
    titleEn: "Grass-Fed Striploin with Chimichurri",
    titleJa: "牧草牛サーロインのチミチュリソース添え",
    excerptEn: "Bright, herby chimichurri cuts through the richness of a well-seared striploin.",
    excerptJa: "香り豊かなチミチュリソースが、香ばしく焼いたサーロインの旨みを引き立てます。",
    category: "grill",
    cookTimeMinutes: 25,
    difficulty: "easy",
    servings: 2,
    productSlugs: ["striploin-grass-fed-block", "herbes-de-provence"],
  },
  {
    slug: "twelve-hour-smoked-brisket",
    titleEn: "Twelve-Hour Smoked Brisket",
    titleJa: "12時間燻製ブリスケット",
    excerptEn: "Low and slow with a simple salt-and-pepper bark — the definition of patience rewarded.",
    excerptJa: "シンプルな塩胡椒のバークでじっくり燻製。忍耐が報われる一皿です。",
    category: "bbq",
    cookTimeMinutes: 720,
    difficulty: "hard",
    servings: 8,
    productSlugs: ["brisket-grass-fed-whole", "steak-house-rub"],
  },
  {
    slug: "sunday-rib-roast",
    titleEn: "Classic Sunday Rib Roast",
    titleJa: "定番のサンデーリブロースト",
    excerptEn: "A crackling fat cap and a perfectly pink center — the roast worth planning your week around.",
    excerptJa: "パリッとした脂と美しいピンク色の断面。1週間の楽しみになる一皿です。",
    category: "oven",
    cookTimeMinutes: 120,
    difficulty: "medium",
    servings: 6,
    productSlugs: ["cube-roll-rib-roast-true-aussie", "finishing-sea-salt"],
  },
  {
    slug: "lamb-rack-herb-crust",
    titleEn: "Herb-Crusted Lamb Rack",
    titleJa: "ハーブクラストのラムラック",
    excerptEn: "A quick mustard-and-herb crust turns a weeknight-fast cut into a dinner party centerpiece.",
    excerptJa: "マスタードとハーブの衣で、手早く作れるのにディナーパーティーの主役級の一皿に。",
    category: "oven",
    cookTimeMinutes: 30,
    difficulty: "easy",
    servings: 2,
    productSlugs: ["lamb-rack-frenched", "herbes-de-provence"],
  },
  {
    slug: "yakiniku-at-home-night",
    titleEn: "Yakiniku-at-Home Night",
    titleJa: "おうち焼肉の夜",
    excerptEn: "Tabletop grill, a few cuts, and everyone serving themselves — the easiest dinner party there is.",
    excerptJa: "卓上グリルと数種類のお肉があれば、みんなで楽しめる一番簡単なホームパーティーに。",
    category: "grill",
    cookTimeMinutes: 40,
    difficulty: "easy",
    servings: 4,
    productSlugs: ["yakiniku-slices-1kg", "beef-tongue-heavenly-tender"],
  },
  {
    slug: "smash-burgers-at-home",
    titleEn: "Smash Burgers at Home",
    titleJa: "おうちで作るスマッシュバーガー",
    excerptEn: "A screaming-hot pan and a spatula are all you need for a lacy, crisp-edged patty.",
    excerptJa: "熱いフライパンとフライ返しさえあれば、カリカリの縁が香ばしいパティが作れます。",
    category: "grill",
    cookTimeMinutes: 20,
    difficulty: "easy",
    servings: 3,
    productSlugs: ["raw-beef-patty-6pack", "garlic-herb-butter-frozen"],
  },
];

async function seedTags() {
  console.log("Seeding tags…");
  for (const t of TAGS) {
    await db.insert(schema.tags).values({ id: uuidv7(), slug: t.slug, labelEn: t.en, labelJa: t.ja, kind: t.kind });
  }
}

async function seedCollections() {
  console.log("Seeding collections…");
  const primary = [
    { slug: "beef", en: "Beef", ja: "牛肉", descEn: "Australian grass-fed, US, and Japanese wagyu beef — steaks, roasts and more.", descJa: "オーストラリア産牧草牛、アメリカ産、和牛まで。ステーキやローストなど豊富に取り揃えています。" },
    { slug: "other-meats", en: "Other Meats", ja: "その他の肉", descEn: "Lamb, kangaroo, duck and other game meats.", descJa: "ラム、カンガルー、鴨肉などのジビエ・その他の肉。" },
    { slug: "charcuterie", en: "Charcuterie", ja: "シャルキュトリー", descEn: "Cured meats, sausages and pâté from Spain, Italy, France and Germany.", descJa: "スペイン・イタリア・フランス・ドイツの熟成肉、ソーセージ、パテ。" },
    { slug: "new-arrivals", en: "New Arrivals", ja: "新着商品", descEn: "The newest cuts to hit our freezer.", descJa: "入荷したばかりの新着商品。" },
    { slug: "spices-and-herbs", en: "Spices & Herbs", ja: "スパイス＆ハーブ", descEn: "Rubs, salts and blends to finish every cut.", descJa: "お肉の仕上げに使えるラブ、塩、ブレンドスパイス。" },
    { slug: "other-frozen", en: "Other Frozen", ja: "その他冷凍食品", descEn: "Broths, sauces and compound butters, ready to heat.", descJa: "温めるだけのブロスやソース、コンパウンドバター。" },
  ];
  for (const [i, c] of primary.entries()) {
    await db.insert(schema.collections).values({
      id: uuidv7(),
      slug: c.slug,
      titleEn: c.en,
      titleJa: c.ja,
      descriptionEn: c.descEn,
      descriptionJa: c.descJa,
      heroImage: collectionPhoto(c.slug),
      kind: c.slug === "new-arrivals" ? "rule" : "manual",
      ruleTag: c.slug === "new-arrivals" ? "new-arrival" : null,
      sortOrder: i,
    });
  }

  const curated = [
    { slug: "steaks", en: "Steaks", ja: "ステーキ", ruleTag: "steaks" },
    { slug: "grass-fed-beef", en: "Grass-fed Beef", ja: "牧草牛", ruleTag: "grass-fed" },
    { slug: "block-meats", en: "Block Meats", ja: "ブロック肉", ruleTag: "block-meats" },
    { slug: "organic-beef", en: "Organic Beef", ja: "オーガニック牛肉", ruleTag: "organic" },
    { slug: "japanese-beef", en: "Japanese (Kokusan) Beef", ja: "国産牛肉", ruleTag: "japan" },
  ];
  for (const [i, c] of curated.entries()) {
    await db.insert(schema.collections).values({
      id: uuidv7(),
      slug: c.slug,
      titleEn: c.en,
      titleJa: c.ja,
      descriptionEn: `${c.en} — curated from across our catalog.`,
      descriptionJa: `${c.ja}の商品をまとめました。`,
      heroImage: collectionPhoto(c.slug),
      kind: "rule",
      ruleTag: c.ruleTag,
      sortOrder: 100 + i,
    });
  }
}

async function seedProducts() {
  console.log(`Seeding ${PRODUCTS.length} products…`);
  const collections = await db.query.collections.findMany();
  const byCategorySlug = new Map(collections.filter((c) => c.kind === "manual").map((c) => [c.slug, c]));
  const ruleCollections = collections.filter((c) => c.kind === "rule" && c.ruleTag);

  // Position of each product within its category (sorted by slug), used to
  // spread photos so neighbouring tiles differ. Mirrors refresh-images.ts.
  const ordinals = new Map<string, number>();
  const counters = new Map<string, number>();
  for (const p of [...PRODUCTS].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const n = counters.get(p.category) ?? 0;
    ordinals.set(p.slug, n);
    counters.set(p.category, n + 1);
  }

  for (const p of PRODUCTS) {
    const productId = uuidv7();
    await db.insert(schema.products).values({
      id: productId,
      slug: p.slug,
      nameEn: p.nameEn,
      nameJa: p.nameJa,
      subtitleEn: p.subtitleEn,
      subtitleJa: p.subtitleJa,
      descriptionEn: p.descriptionEn,
      descriptionJa: p.descriptionJa,
      cookingGuideEn: p.cookingGuideEn,
      cookingGuideJa: p.cookingGuideJa,
      origin: p.origin,
      feed: p.feed,
      grade: p.grade,
      cut: p.cut,
      category: p.category,
      tagsCsv: p.tags.join(","),
      isNewArrival: !!p.isNewArrival,
      salesCount: Math.floor(Math.random() * 120),
      ratingAvg: 0,
      ratingCount: 0,
    });

    const imageCount = p.images ?? 1;
    for (let i = 0; i < imageCount; i++) {
      await db.insert(schema.productImages).values({
        id: uuidv7(),
        productId,
        url: productPhotoAt(p.category, ordinals.get(p.slug) ?? 0, i),
        alt: p.nameEn,
        sortOrder: i,
      });
    }

    for (const [i, v] of p.variants.entries()) {
      await db.insert(schema.productVariants).values({
        id: uuidv7(),
        productId,
        sku: `${p.slug.slice(0, 12).toUpperCase()}-${i + 1}`,
        labelEn: v.labelEn,
        labelJa: v.labelJa,
        weightGrams: v.weightGrams,
        priceJpy: v.priceJpy,
        compareAtPriceJpy: v.compareAtPriceJpy,
        stock: v.stock,
        sortOrder: i,
      });
    }

    const categoryCollection = byCategorySlug.get(p.category);
    if (categoryCollection) {
      await db.insert(schema.productCollections).values({ id: uuidv7(), productId, collectionId: categoryCollection.id });
    }
    const tagSet = new Set([...p.tags, p.isNewArrival ? "new-arrival" : ""]);
    for (const rc of ruleCollections) {
      if (rc.ruleTag && tagSet.has(rc.ruleTag)) {
        await db.insert(schema.productCollections).values({ id: uuidv7(), productId, collectionId: rc.id });
      }
    }
  }
}

const REVIEW_AUTHORS = ["Yuki M.", "Hiroshi K.", "Emma T.", "Daniel R.", "Sakura N.", "Michael B.", "Aoi S.", "James L.", "Nanami F.", "Chris P."];
const REVIEW_BODIES_EN = [
  "Incredible quality — arrived still rock solid frozen and the marbling was better than photos.",
  "This has become our go-to for special dinners. Cooked exactly as the guide described.",
  "Good value for the quality. Packaging kept everything perfectly frozen during delivery.",
  "A bit pricier than the supermarket, but there's genuinely no comparison in flavor.",
  "Ordered for a birthday dinner and it did not disappoint. Will order again.",
  "Cooking guide on the product page was spot on — nailed medium-rare on the first try.",
];
const REVIEW_BODIES_JA = [
  "とても美味しかったです。梱包もしっかりしていて冷凍状態も完璧でした。",
  "特別な日のディナーに注文しました。写真以上のサシで大満足です。",
  "コスパも良く、また注文したいと思います。",
  "スーパーより少し高いですが、味は全く違います。",
  "誕生日のディナーに購入しました。とても喜んでもらえました。",
  "商品ページの焼き方ガイド通りにやったら、初めてでも綺麗なミディアムレアに焼けました。",
];

async function seedReviewsAndQA(customerId: string) {
  console.log("Seeding reviews and Q&A…");
  const products = await db.query.products.findMany();
  let reviewCount = 0;
  let qaCount = 0;

  for (const p of products) {
    if (Math.random() < 0.75 && reviewCount < 30) {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n && reviewCount < 30; i++) {
        const rating = 3 + Math.floor(Math.random() * 3);
        const idx = Math.floor(Math.random() * REVIEW_AUTHORS.length);
        await db.insert(schema.reviews).values({
          id: uuidv7(),
          productId: p.id,
          userId: i === 0 && Math.random() < 0.3 ? customerId : null,
          authorName: REVIEW_AUTHORS[idx],
          rating,
          title: rating >= 4 ? "Highly recommend" : "Pretty good",
          body: REVIEW_BODIES_EN[idx % REVIEW_BODIES_EN.length] + " " + REVIEW_BODIES_JA[idx % REVIEW_BODIES_JA.length],
          verifiedPurchase: Math.random() < 0.8,
          helpfulCount: Math.floor(Math.random() * 15),
        });
        reviewCount++;
      }
    }
  }

  // Update rating aggregates now that all reviews exist.
  for (const p of products) {
    const ratings = await db.query.reviews.findMany({ where: eq(schema.reviews.productId, p.id) });
    if (ratings.length) {
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      await db.update(schema.products).set({ ratingAvg: Math.round(avg * 10) / 10, ratingCount: ratings.length }).where(eq(schema.products.id, p.id));
    }
  }

  const QUESTIONS = [
    "Does this ship with ice packs?",
    "How long does it stay frozen during delivery?",
    "Can I request a specific delivery date?",
    "Is this suitable for sous-vide cooking?",
    "What's the fat content like on this cut?",
    "Do you offer a larger bulk size?",
    "Is the packaging recyclable?",
    "Can I cook this from frozen?",
    "How many servings does this make?",
    "Is this cut boneless?",
  ];
  const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, QUESTIONS.length);
  for (const [i, p] of shuffled.entries()) {
    const qId = uuidv7();
    await db.insert(schema.questions).values({
      id: qId,
      productId: p.id,
      authorName: REVIEW_AUTHORS[i % REVIEW_AUTHORS.length],
      body: QUESTIONS[i],
      status: "answered",
    });
    await db.insert(schema.answers).values({
      id: uuidv7(),
      questionId: qId,
      authorName: "Whole Cuts Staff",
      body: "Great question! Yes — all cool-chain orders ship with gel ice packs and typically stay frozen for 24–36 hours in transit. Feel free to reach out via our contact page for anything cut-specific.",
    });
    qaCount++;
  }
  console.log(`  ${reviewCount} reviews, ${qaCount} Q&A pairs`);
}

async function seedRecipes() {
  console.log("Seeding recipes…");
  const products = await db.query.products.findMany();
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  for (const r of RECIPES) {
    const recipeId = uuidv7();
    await db.insert(schema.recipes).values({
      id: recipeId,
      slug: r.slug,
      titleEn: r.titleEn,
      titleJa: r.titleJa,
      excerptEn: r.excerptEn,
      excerptJa: r.excerptJa,
      bodyEn: `## Ingredients\n\n- The featured cut, brought to room temperature\n- Salt and freshly cracked pepper\n- 2 tbsp neutral oil\n- Optional: compound butter or herb garnish to finish\n\n## Method\n\n1. Prepare the meat and pat it fully dry.\n2. Season generously and let it rest at room temperature for 20–30 minutes.\n3. Cook according to the linked product's cooking guide.\n4. Rest before slicing, then serve immediately.\n\nEnjoy with a simple side and a good bottle of red.`,
      bodyJa: `## 材料\n\n- メインとなるお肉（室温に戻しておく）\n- 塩・挽きたての黒胡椒\n- 食用油 大さじ2\n- お好みでコンパウンドバターやハーブ\n\n## 作り方\n\n1. お肉の水分をしっかり拭き取ります。\n2. たっぷりと下味をつけ、20〜30分ほど室温に置きます。\n3. 商品ページの焼き方ガイドに沿って調理します。\n4. 休ませてからカットし、すぐにお召し上がりください。\n\nシンプルな付け合わせと赤ワインと一緒にどうぞ。`,
      heroImage: recipePhoto(r.category, r.slug),
      category: r.category,
      cookTimeMinutes: r.cookTimeMinutes,
      difficulty: r.difficulty,
      servings: r.servings,
    });
    for (const slug of r.productSlugs) {
      const product = bySlug.get(slug);
      if (product) {
        await db.insert(schema.recipeProducts).values({ id: uuidv7(), recipeId, productId: product.id, quantityLabel: "1" });
      }
    }
  }
}

async function seedDiscountsAndShipping() {
  console.log("Seeding discounts and shipping zones…");
  await db.insert(schema.discounts).values([
    {
      id: uuidv7(),
      code: "WELCOME10",
      kind: "percent",
      value: 10,
      minSpendJpy: 3000,
      usageLimitPerCustomer: 1,
      active: true,
    },
    {
      id: uuidv7(),
      code: "FREESHIP",
      kind: "free-shipping",
      value: 0,
      minSpendJpy: 5000,
      active: true,
    },
  ]);

  for (const pref of PREFECTURES) {
    const remote = pref === "Hokkaido" || pref === "Okinawa";
    await db.insert(schema.shippingZones).values({
      id: uuidv7(),
      prefecture: pref,
      baseFeeJpy: 1200,
      surchargeJpy: remote ? 1500 : 0,
    });
  }
}

async function seedSettings() {
  console.log("Seeding store settings…");
  const entries: Array<[string, unknown]> = [
    ["free_shipping_threshold_jpy", 15000],
    ["reduced_tax_rate", 0.08],
    ["delivery_lead_time_business_days", 2],
    ["blackout_dates", []],
    [
      "tokushoho_text",
      "販売事業者: Whole Cuts 合同会社 / 運営責任者: 佐藤健二 / 所在地: 〒150-0001 東京都渋谷区神宮前1-1-1 / 電話番号: 03-1234-5678（受付時間 平日10:00〜18:00） / メールアドレス: support@wholecuts.example / 販売価格: 各商品ページに税込価格を表示 / 商品代金以外の必要料金: 送料（配送先により異なります） / 引渡し時期: ご注文後、最短2営業日で発送 / お支払い方法: クレジットカード、コンビニ決済 / 返品について: 商品の性質上、返品はお受けできません。不良品の場合はお問い合わせください。",
    ],
  ];
  for (const [key, value] of entries) {
    await db.insert(schema.settings).values({ key, value: JSON.stringify(value) });
  }
}

async function seedDemoOrdersAndExtras(customerId: string) {
  console.log("Seeding demo orders, addresses, wishlist, and a subscription for the demo customer…");
  const addressId = uuidv7();
  await db.insert(schema.addresses).values({
    id: addressId,
    userId: customerId,
    label: "Home",
    fullName: "Aiko Tanaka",
    fullNameKana: "タナカ アイコ",
    phone: "090-1234-5678",
    postalCode: "150-0001",
    prefecture: "Tokyo",
    city: "Shibuya-ku",
    addressLine1: "Jingumae 1-1-1",
    addressLine2: "Apt 302",
    isDefault: true,
  });

  const products = await db.query.products.findMany({ with: { variants: true, images: true } });
  const tomahawk = products.find((p) => p.slug === "ember-tomahawk-caveman-cut")!;
  const ribeye = products.find((p) => p.slug === "ribeye-extra-thick")!;
  const wagyu = products.find((p) => p.slug === "wagyu-a5-sirloin")!;

  async function createOrder(status: string, daysAgo: number, items: Array<{ product: typeof tomahawk; variantIdx: number; qty: number }>) {
    const orderId = uuidv7();
    const lineItems = items.map(({ product, variantIdx, qty }) => {
      const v = product.variants[variantIdx];
      return { product, variant: v, qty, lineTotal: v.priceJpy * qty };
    });
    const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
    const shipping = 1200;
    const total = subtotal + shipping;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    await db.insert(schema.orders).values({
      id: orderId,
      orderNumber: orderNumber(),
      userId: customerId,
      email: "customer@wholecuts.example",
      status,
      subtotalJpy: subtotal,
      shippingJpy: shipping,
      taxJpy: Math.round(total - total / 1.08),
      totalJpy: total,
      pointsEarned: Math.floor(total * 0.01),
      shippingName: "Aiko Tanaka",
      shippingNameKana: "タナカ アイコ",
      shippingPhone: "090-1234-5678",
      shippingPostalCode: "150-0001",
      shippingPrefecture: "Tokyo",
      shippingCity: "Shibuya-ku",
      shippingAddressLine1: "Jingumae 1-1-1",
      shippingAddressLine2: "Apt 302",
      deliveryDate: new Date(createdAt.getTime() + 3 * 86400000).toISOString().slice(0, 10),
      deliverySlot: "14-16",
      paymentMethod: "test",
      carrier: status === "shipped" || status === "delivered" ? "yamato" : null,
      trackingNumber: status === "shipped" || status === "delivered" ? "1234-5678-9012" : null,
      createdAt,
      updatedAt: createdAt,
    });

    for (const l of lineItems) {
      await db.insert(schema.orderItems).values({
        id: uuidv7(),
        orderId,
        productId: l.product.id,
        variantId: l.variant.id,
        nameEn: l.product.nameEn,
        nameJa: l.product.nameJa,
        variantLabelEn: l.variant.labelEn,
        variantLabelJa: l.variant.labelJa,
        image: l.product.images[0]?.url ?? "",
        unitPriceJpy: l.variant.priceJpy,
        quantity: l.qty,
        lineTotalJpy: l.lineTotal,
      });
    }
    await db.insert(schema.loyaltyLedger).values({
      id: uuidv7(),
      userId: customerId,
      points: Math.floor(total * 0.01),
      reason: "order",
      orderId,
      createdAt,
    });
  }

  await createOrder("delivered", 20, [{ product: ribeye, variantIdx: 1, qty: 2 }]);
  await createOrder("shipped", 5, [{ product: tomahawk, variantIdx: 2, qty: 1 }]);
  await createOrder("paid", 0, [{ product: wagyu, variantIdx: 0, qty: 2 }]);

  const totalPoints = await db.query.loyaltyLedger.findMany({ where: (l, { eq }) => eq(l.userId, customerId) });
  const balance = totalPoints.reduce((s, l) => s + l.points, 0);
  await db.update(schema.user).set({ pointsBalance: balance }).where(eq(schema.user.id, customerId));

  await db.insert(schema.wishlists).values([
    { id: uuidv7(), userId: customerId, productId: wagyu.id },
    { id: uuidv7(), userId: customerId, productId: tomahawk.id },
  ]);

  await db.insert(schema.subscriptions).values({
    id: uuidv7(),
    userId: customerId,
    name: "Weekend Steak Box",
    frequencyWeeks: 2,
    status: "active",
    nextDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    deliverySlot: "morning",
    totalJpy: ribeye.variants[1].priceJpy * 2,
    addressId,
  });
  const subs = await db.query.subscriptions.findFirst({ where: (s, { eq }) => eq(s.userId, customerId) });
  if (subs) {
    await db.insert(schema.subscriptionItems).values({ id: uuidv7(), subscriptionId: subs.id, variantId: ribeye.variants[1].id, quantity: 2 });
  }

  await db.insert(schema.referrals).values({ id: uuidv7(), userId: customerId, code: "AIKO-FRIEND" });

  const soldOutVariant = await db.query.productVariants.findFirst({ where: (v, { eq }) => eq(v.stock, 0) });
  if (soldOutVariant) {
    await db.insert(schema.stockAlerts).values({
      id: uuidv7(),
      userId: customerId,
      email: "customer@wholecuts.example",
      variantId: soldOutVariant.id,
      productId: soldOutVariant.productId,
    });
  }

  await db.insert(schema.inquiries).values({
    id: uuidv7(),
    kind: "wholesale",
    name: "Marco Rossi",
    email: "marco@example-restaurant.jp",
    company: "Trattoria Marco",
    message: "Hi, I run a small Italian restaurant in Osaka and I'm interested in weekly wholesale pricing for your charcuterie. Could you send over a wholesale price list?",
  });
}

async function main() {
  await resetDatabase();
  const { customerId, adminId } = await seedUsers();
  await seedTags();
  await seedCollections();
  await seedProducts();
  await seedReviewsAndQA(customerId);
  await seedRecipes();
  await seedDiscountsAndShipping();
  await seedSettings();
  await seedDemoOrdersAndExtras(customerId);

  await db.insert(schema.auditLogs).values({
    id: uuidv7(),
    actorId: adminId,
    actorName: "Admin User",
    action: "system.seed",
    detail: "Database seeded with demo catalog and content.",
  });

  console.log("\n✅ Seed complete!\n");
  console.log("Demo accounts (password: password123):");
  console.log("  customer@wholecuts.example  (customer)");
  console.log("  staff@wholecuts.example     (staff)");
  console.log("  admin@wholecuts.example     (admin)\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    return pool.end();
  });
