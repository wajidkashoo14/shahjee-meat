import { randomBytes } from "node:crypto";

/**
 * Lightweight UUIDv7 generator (time-ordered UUID, RFC 9562).
 * No extra dependency needed — Node's crypto gives us random bytes.
 */
export function uuidv7(): string {
  const unixMs = BigInt(Date.now());
  const rand = randomBytes(10);

  const bytes = Buffer.alloc(16);
  bytes[0] = Number((unixMs >> 40n) & 0xffn);
  bytes[1] = Number((unixMs >> 32n) & 0xffn);
  bytes[2] = Number((unixMs >> 24n) & 0xffn);
  bytes[3] = Number((unixMs >> 16n) & 0xffn);
  bytes[4] = Number((unixMs >> 8n) & 0xffn);
  bytes[5] = Number(unixMs & 0xffn);

  bytes[6] = 0x70 | (rand[0] & 0x0f); // version 7
  bytes[7] = rand[1];
  bytes[8] = 0x80 | (rand[2] & 0x3f); // variant
  bytes.set(rand.subarray(3, 10), 9);

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function orderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WC${y}${m}${d}-${rand}`;
}
