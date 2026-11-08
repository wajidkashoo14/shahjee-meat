/**
 * Curated, relevant photography (Unsplash License — free for commercial use)
 * for every catalog category, collection and recipe. Used by the seed script
 * and by `npm run db:images`, which refreshes images on an existing database.
 */

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`;

const P = {
  // beef
  steaksOnPaper: "1690983323540-d6e889c4b107",
  ribeyes: "1690983322025-aab4f95a0269",
  beefBoard: "1666013942642-b7b54ecafd7d",
  rawSlab: "1628543108325-1c27cd7246b3",
  steakPair: "1690983322025-aab4f95a0269",
  ribeyesRack: "1772285466464-8ccda2c3be92",
  cutsDark: "1690983325551-b922137727be",
  cutsLight: "1690983323238-0b91789e1b5a",
  boneInRibeye: "1788178941299-b206d3f4c4c6",
  striploinBoard: "1613454320437-0c228c8b1723",
  ribeyeKnife: "1690983321750-ad6f6d59a84b",
  ribeyeSalt: "1588347818036-558601350947",
  sirloinSlices: "1602470521006-59ab77068b0d",
  steaksGarlic: "1690983330536-3b0089d07cf9",
  filetPair: "1723893905879-0e309c2a8e06",
  // wagyu / japanese
  wagyuPlatter: "1773902665665-0f3077aa9355",
  wagyuMarbled: "1764994880917-b46601e402ab",
  filet: "1615937691194-97dbd3f3dc29",
  // grass-fed
  pasture: "1753563715245-63723475936d",
  // lamb / game
  lambRack: "1692106914421-e04e1066bd62",
  lambRack2: "1766589152317-fd811dd44c65",
  lambRack3: "1766589152343-874c0e138262",
  lambRibs: "1766589152485-9aafd9812a19",
  // charcuterie
  charcBoard: "1744848279514-b6cbcf03b5f5",
  charcBoard2: "1774689338470-e4ae7d63670d",
  salamiSliced: "1768758922609-fd805f703507",
  salamiRustic: "1769772619357-216a3085f718",
  cured: "1460122109654-7e46ab4fc9b9",
  charcSpread: "1616631124348-c63521eb484c",
  // spices
  spiceBowls: "1771541897176-44a3e01dc484",
  spiceTable: "1716816211590-c15a328a5ff0",
  spiceFlat: "1581600140682-d4e68c8cde32",
  spiceSpoons: "1506368249639-73a05d6f6488",
  spiceWhite: "1596040033229-a9821ebd058d",
  // frozen / broth / sauces
  brothBowl: "1625535608282-8f181a38f9e7",
  brothJar: "1624251526069-e8677ce6831f",
  herbOil: "1765118527220-da9c7a560b13",
  stew: "1572171579626-e79450374587",
} as const;

const COLLECTIONS: Record<string, string> = {
  beef: P.steaksOnPaper,
  "other-meats": P.lambRack,
  charcuterie: P.charcBoard2,
  "new-arrivals": P.rawSlab,
  "spices-and-herbs": P.spiceBowls,
  "other-frozen": P.brothBowl,
  steaks: P.ribeyes,
  "grass-fed-beef": P.pasture,
  "block-meats": P.beefBoard,
  "organic-beef": P.filet,
  "japanese-beef": P.wagyuMarbled,
};

const PRODUCT_POOLS: Record<string, string[]> = {
  beef: [
    P.steaksOnPaper, P.ribeyesRack, P.beefBoard, P.boneInRibeye, P.wagyuMarbled, P.striploinBoard,
    P.cutsDark, P.ribeyeSalt, P.filet, P.ribeyeKnife, P.sirloinSlices, P.ribeyes, P.steaksGarlic,
    P.cutsLight, P.filetPair, P.wagyuPlatter, P.rawSlab,
  ],
  "other-meats": [P.lambRack, P.lambRack2, P.lambRack3, P.lambRibs],
  charcuterie: [P.charcBoard, P.salamiSliced, P.salamiRustic, P.cured, P.charcSpread],
  spices: [P.spiceBowls, P.spiceTable, P.spiceFlat, P.spiceSpoons, P.spiceWhite],
  frozen: [P.brothBowl, P.brothJar, P.herbOil, P.stew],
};

const RECIPE_POOLS: Record<string, string[]> = {
  grill: [P.ribeyes, P.steaksOnPaper, P.wagyuPlatter],
  bbq: [P.lambRibs, P.beefBoard, P.rawSlab],
  oven: [P.lambRack, P.lambRack2, P.filet],
  stew: [P.stew, P.brothBowl],
  raw: [P.wagyuMarbled, P.wagyuPlatter],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick(pool: string[], key: string, offset = 0) {
  return u(pool[(hash(key) + offset) % pool.length]);
}

export function collectionPhoto(slug: string) {
  return u(COLLECTIONS[slug] ?? P.steaksOnPaper);
}

export function productPhoto(category: string, slug: string, index = 0) {
  return pick(PRODUCT_POOLS[category] ?? PRODUCT_POOLS.beef, slug, index);
}

/**
 * Photo for the Nth product of a category (ordinal = position within its
 * category). Walking the pool in order keeps neighbouring tiles distinct;
 * extra gallery images (index > 0) are offset so they differ from the cover.
 */
export function productPhotoAt(category: string, ordinal: number, index = 0) {
  const pool = PRODUCT_POOLS[category] ?? PRODUCT_POOLS.beef;
  return u(pool[(ordinal + index * 5) % pool.length]);
}

export function recipePhoto(category: string, slug: string) {
  return pick(RECIPE_POOLS[category] ?? RECIPE_POOLS.grill, slug);
}

/** Wide hero banner photo for the storefront homepage. */
export function heroPhoto() {
  return `https://images.unsplash.com/photo-${P.ribeyes}?auto=format&fit=crop&w=2000&q=75`;
}
