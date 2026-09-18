import { describe, it, expect } from "vitest";
import { taxInclusiveBreakdown, REDUCED_TAX_RATE } from "@/lib/tax";

describe("taxInclusiveBreakdown", () => {
  it("splits a tax-inclusive total into exclusive price + tax at the reduced 8% rate", () => {
    const { exclusive, tax } = taxInclusiveBreakdown(1080);
    expect(exclusive).toBe(1000);
    expect(tax).toBe(80);
  });

  it("always reconstructs the original total exactly (no rounding drift)", () => {
    for (const total of [1, 100, 1234, 5960, 99999]) {
      const { exclusive, tax } = taxInclusiveBreakdown(total);
      expect(exclusive + tax).toBe(total);
    }
  });

  it("returns zero for a zero total", () => {
    expect(taxInclusiveBreakdown(0)).toEqual({ exclusive: 0, tax: 0 });
  });

  it("supports a custom rate", () => {
    const { exclusive, tax } = taxInclusiveBreakdown(1100, 0.1);
    expect(exclusive).toBe(1000);
    expect(tax).toBe(100);
  });

  it("defaults to Japan's reduced food tax rate of 8%", () => {
    expect(REDUCED_TAX_RATE).toBe(0.08);
  });
});
