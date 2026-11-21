import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer JPY amount, e.g. 4980 -> "¥4,980". JPY is zero-decimal. */
export function formatJpy(amountJpy: number): string {
  // ja-JP emits the full-width "￥" (U+FFE5), which Latin UI fonts lack; the
  // fallback CJK glyph sits loose next to the digits. Use the standard "¥".
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  })
    .format(amountJpy)
    .replace("\uFFE5", "\u00A5");
}

export function formatPer100g(priceJpy: number, weightGrams: number): string {
  if (!weightGrams) return "";
  const per100 = Math.round((priceJpy / weightGrams) * 100);
  return `${formatJpy(per100)} / 100g`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}
