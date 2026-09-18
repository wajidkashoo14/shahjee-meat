import { describe, it, expect } from "vitest";
import { formatJpy, formatPer100g, slugify, cn } from "@/lib/utils";

describe("formatJpy", () => {
  it("formats a zero-decimal JPY amount with the yen sign and thousands separators", () => {
    expect(formatJpy(4980)).toBe("￥4,980");
    expect(formatJpy(0)).toBe("￥0");
  });

  it("never shows decimal places (JPY is zero-decimal)", () => {
    expect(formatJpy(1000)).not.toContain(".");
  });
});

describe("formatPer100g", () => {
  it("computes a proportional price per 100g", () => {
    expect(formatPer100g(2000, 500)).toBe("￥400 / 100g");
  });

  it("returns an empty string when weight is zero to avoid a divide-by-zero", () => {
    expect(formatPer100g(2000, 0)).toBe("");
  });
});

describe("slugify", () => {
  it("lowercases, trims, and hyphenates a name", () => {
    expect(slugify("Tomahawk Steak | Ember Caveman Cut")).toBe("tomahawk-steak-ember-caveman-cut");
  });

  it("collapses repeated separators", () => {
    expect(slugify("A   B---C")).toBe("a-b-c");
  });
});

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
