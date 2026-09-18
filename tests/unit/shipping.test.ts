import { describe, it, expect } from "vitest";
import { shippingFeeFor, FREE_SHIPPING_THRESHOLD_JPY, PREFECTURES } from "@/lib/shipping";

describe("shippingFeeFor", () => {
  it("charges the base cool-delivery fee for a standard prefecture", () => {
    expect(shippingFeeFor("Tokyo", 3000)).toBe(1200);
  });

  it("adds the remote surcharge for Hokkaido", () => {
    expect(shippingFeeFor("Hokkaido", 3000)).toBe(1200 + 1500);
  });

  it("adds the remote surcharge for Okinawa", () => {
    expect(shippingFeeFor("Okinawa", 3000)).toBe(1200 + 1500);
  });

  it("is free once the subtotal reaches the free-shipping threshold, anywhere", () => {
    expect(shippingFeeFor("Tokyo", FREE_SHIPPING_THRESHOLD_JPY)).toBe(0);
    expect(shippingFeeFor("Hokkaido", FREE_SHIPPING_THRESHOLD_JPY)).toBe(0);
  });

  it("lists all 47 prefectures", () => {
    expect(PREFECTURES).toHaveLength(47);
    expect(new Set(PREFECTURES).size).toBe(47);
  });
});
