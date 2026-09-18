import { describe, it, expect } from "vitest";
import { uuidv7, orderNumber } from "@/lib/id";

describe("uuidv7", () => {
  it("produces a well-formed UUID with version 7 and the correct variant bits", () => {
    const id = uuidv7();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("is time-ordered: the embedded 48-bit timestamp never goes backwards", () => {
    const timestampOf = (id: string) => BigInt(`0x${id.replace(/-/g, "").slice(0, 12)}`);
    const a = timestampOf(uuidv7());
    const b = timestampOf(uuidv7());
    expect(b >= a).toBe(true);
  });

  it("never collides across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuidv7()));
    expect(ids.size).toBe(1000);
  });
});

describe("orderNumber", () => {
  it("matches the WCYYMMDD-#### format", () => {
    expect(orderNumber()).toMatch(/^WC\d{6}-\d{4}$/);
  });
});
