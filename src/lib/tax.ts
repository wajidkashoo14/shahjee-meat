/**
 * Japan's 総額表示 (sōgaku hyōji) rule requires displayed prices to be
 * tax-inclusive. Food is taxed at the reduced 8% rate (vs. 10% standard).
 * All product prices in this app are stored tax-inclusive; this helper
 * back-calculates the informational tax line for the order summary.
 */
export const REDUCED_TAX_RATE = 0.08;

export function taxInclusiveBreakdown(totalInclusiveJpy: number, rate = REDUCED_TAX_RATE) {
  const exclusive = Math.round(totalInclusiveJpy / (1 + rate));
  const tax = totalInclusiveJpy - exclusive;
  return { exclusive, tax };
}
