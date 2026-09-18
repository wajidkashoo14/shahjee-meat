export const PREFECTURES = [
  "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
  "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
  "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
  "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
  "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

const REMOTE_SURCHARGE_JPY = 1500;
const BASE_COOL_DELIVERY_FEE_JPY = 1200;
export const FREE_SHIPPING_THRESHOLD_JPY = 15000;

export function shippingFeeFor(prefecture: string, subtotalJpy: number): number {
  if (subtotalJpy >= FREE_SHIPPING_THRESHOLD_JPY) return 0;
  const remote = prefecture === "Hokkaido" || prefecture === "Okinawa";
  return BASE_COOL_DELIVERY_FEE_JPY + (remote ? REMOTE_SURCHARGE_JPY : 0);
}

export const DELIVERY_SLOTS = [
  { id: "morning", labelEn: "Morning (8–12)", labelJa: "午前中" },
  { id: "14-16", labelEn: "14:00–16:00", labelJa: "14時〜16時" },
  { id: "16-18", labelEn: "16:00–18:00", labelJa: "16時〜18時" },
  { id: "18-20", labelEn: "18:00–20:00", labelJa: "18時〜20時" },
  { id: "19-21", labelEn: "19:00–21:00", labelJa: "19時〜21時" },
] as const;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];
