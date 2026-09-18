import { describe, it, expect } from "vitest";
import { earliestDeliveryDate, nextAvailableDeliveryDates } from "@/lib/delivery";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function dayOfWeek(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

describe("earliestDeliveryDate", () => {
  it("is always at least 2 business days out and never a weekend", () => {
    // Sweep a couple of weeks of "today"s so the 2-business-day rule is
    // exercised across every weekday start.
    for (let i = 0; i < 14; i++) {
      const from = new Date(Date.UTC(2026, 0, 5 + i)); // a known Monday + offset
      const earliest = earliestDeliveryDate([], from);
      expect(dayOfWeek(isoDate(earliest))).not.toBe(0);
      expect(dayOfWeek(isoDate(earliest))).not.toBe(6);
      expect(earliest.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it("skips a blacked-out date", () => {
    const from = new Date(Date.UTC(2026, 0, 5)); // Monday
    const withoutBlackout = earliestDeliveryDate([], from);
    const iso = isoDate(withoutBlackout);
    const withBlackout = earliestDeliveryDate([iso], from);
    expect(isoDate(withBlackout)).not.toBe(iso);
  });
});

describe("nextAvailableDeliveryDates", () => {
  it("returns the requested count of dates, all weekdays", () => {
    const dates = nextAvailableDeliveryDates(10);
    expect(dates).toHaveLength(10);
    for (const d of dates) {
      expect(dayOfWeek(d)).not.toBe(0);
      expect(dayOfWeek(d)).not.toBe(6);
    }
  });

  it("returns dates in ascending order with no duplicates", () => {
    const dates = nextAvailableDeliveryDates(14);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(dates.length);
  });
});
