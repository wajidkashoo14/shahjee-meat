// WCAG contrast check for the design tokens.
//
// Reads the token values straight from src/app/globals.css (the light :root
// block plus the [data-theme="dark"] overrides), so the result always matches
// what ships. Exits with code 1 if any pair falls below its minimum.
//
//   npm run check:contrast
//
// Add a pair below whenever a new foreground/background combination is used.
import { readFileSync } from "node:fs";

const cssPath = process.argv[2] ?? new URL("../src/app/globals.css", import.meta.url);
const css = readFileSync(cssPath, "utf8");

function tokens(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Block not found in globals.css: ${selector}`);
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const light = tokens(":root");
const dark = { ...light, ...tokens(':root[data-theme="dark"]') };

function resolve(map, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token reference at --${name}`);
  seen.add(name);
  const value = map[name];
  if (value === undefined) throw new Error(`Undefined token --${name}`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(map, ref[1], seen);
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--${name} is not a 6-digit hex color: ${value}`);
  return value;
}

const channel = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const BODY = 7; // AAA, used for running text
const TEXT = 4.5; // AA, normal-size text
const UI = 3; // AA, large text, control boundaries, icons, chart marks

// [foreground, background, minimum, where the pair is used]
const PAIRS = [
  // Base: ink on parchment. Links, eyebrows, stars and icons are ink too.
  ["foreground", "background", BODY, "body text, links, stars, icons"],
  ["foreground", "surface", BODY, "text on cards"],
  ["foreground", "surface-raised", BODY, "table headers, highlighted menu item"],
  ["foreground-muted", "background", TEXT, "secondary text, eyebrows"],
  ["foreground-muted", "surface", TEXT, "secondary text on cards"],
  ["foreground-muted", "surface-raised", TEXT, "secondary text on muted fills"],
  ["background", "foreground", BODY, "ink pills: active tab, selected size and filter, 'New' and 'paid' badges"],
  // Pop: the green, on main buttons only.
  ["primary-foreground", "primary", TEXT, "main button label"],
  ["primary-foreground", "primary-hover", TEXT, "main button label, hover"],
  ["primary", "background", UI, "main button against the canvas"],
  ["primary", "surface", UI, "main button on cards"],
  ["primary", "scrim", UI, "main button on the photo hero"],
  ["sale", "surface", TEXT, "sale price"],
  ["sale", "background", TEXT, "sale price on the canvas"],
  ["sale-foreground", "sale", TEXT, "SALE badge"],
  ["danger", "surface", TEXT, "error text"],
  ["danger", "background", TEXT, "error text on the canvas"],
  ["danger-foreground", "danger", TEXT, "destructive button"],
  ["danger-soft-foreground", "danger-soft", TEXT, "error panel, 'refunded' badge"],
  ["success", "surface", TEXT, "success text"],
  ["success-foreground", "success", TEXT, "solid success badge"],
  ["success-soft-foreground", "success-soft", TEXT, "success panel, 'delivered' badge"],
  ["warning", "surface", TEXT, "low-stock text"],
  ["warning-foreground", "warning", TEXT, "solid warning badge"],
  ["warning-soft-foreground", "warning-soft", TEXT, "'packing' / 'pending' badge"],
  ["info", "surface", TEXT, "info text"],
  ["info-foreground", "info", TEXT, "solid info badge"],
  ["info-soft-foreground", "info-soft", TEXT, "'shipped' badge"],
  ["input", "surface", UI, "form-control border"],
  ["input", "background", UI, "form-control border on the canvas"],
  ["ring", "surface", UI, "focus ring"],
  ["ring", "background", UI, "focus ring on the canvas"],
  ["foreground-inverse", "surface-inverse", BODY, "sidebar and footer text, footer headings"],
  ["foreground-inverse", "surface-inverse-raised", BODY, "active sidebar item and its marker"],
  ["foreground-inverse-muted", "surface-inverse", TEXT, "sidebar and footer secondary text"],
  ["foreground-inverse-muted", "surface-inverse-raised", TEXT, "secondary text on the active item"],
  ["on-scrim", "scrim", BODY, "text over photo scrims, Wagyu badge"],
  ["chart-1", "surface", UI, "chart series 1"],
  ["chart-2", "surface", UI, "chart series 2"],
  ["chart-3", "surface", UI, "chart series 3"],
  ["chart-4", "surface", UI, "chart series 4"],
  ["chart-5", "surface", UI, "chart series 5"],
];

let failures = 0;
for (const [mode, map] of [["light", light], ["dark", dark]]) {
  console.log(`\n${mode}`);
  for (const [fg, bg, min, use] of PAIRS) {
    const r = ratio(resolve(map, fg), resolve(map, bg));
    const pass = r >= min;
    if (!pass) failures++;
    console.log(`  ${pass ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg} — ${use}`);
  }
}
console.log(`\n${PAIRS.length * 2} pairs checked, ${failures} failing.`);
process.exitCode = failures ? 1 : 0;
