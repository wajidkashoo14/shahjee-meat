const LEAD_TIME_BUSINESS_DAYS = 2;

function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6; // no Sun/Sat delivery by default
}

/** Earliest deliverable date = today + N business days, skipping weekends and blackout dates. */
export function earliestDeliveryDate(blackoutDatesIso: string[] = [], from = new Date()): Date {
  const blackout = new Set(blackoutDatesIso);
  const d = new Date(from);
  let added = 0;
  while (added < LEAD_TIME_BUSINESS_DAYS || blackout.has(d.toISOString().slice(0, 10)) || !isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d) && !blackout.has(d.toISOString().slice(0, 10))) added++;
  }
  return d;
}

export function nextAvailableDeliveryDates(count = 14, blackoutDatesIso: string[] = []): string[] {
  const dates: string[] = [];
  const start = earliestDeliveryDate(blackoutDatesIso);
  const cursor = new Date(start);
  const blackout = new Set(blackoutDatesIso);
  while (dates.length < count) {
    const iso = cursor.toISOString().slice(0, 10);
    if (isBusinessDay(cursor) && !blackout.has(iso)) dates.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
