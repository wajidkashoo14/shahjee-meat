# Whole Cuts design system: "Ink & Pasture"

This document records the visual identity used across the storefront, the customer account and the admin dashboard. It covers why this identity was chosen, what each token is for, and the rules for applying them. The tokens live in [`src/app/globals.css`](src/app/globals.css). The fonts are loaded in [`src/app/layout.tsx`](src/app/layout.tsx).

The system started as "Pasture & Brass" (section 2). It was then tightened to a two-plus-one palette (section 3): two base colors, parchment and ink, plus one pop color, pasture green, used only on main buttons.

## 1. Brief

- **Brand:** a premium online butcher. It ships frozen grass-fed beef, wagyu, lamb, game, charcuterie and spices across Japan, with bilingual EN/JA pages.
- **Audience:** home cooks, expats and food lovers who pay for provenance; restaurant buyers sending wholesale inquiries; staff working in the admin all day.
- **It must feel:** high-quality, fresh, trustworthy, sophisticated and professional.
- **It must avoid:** generic SaaS color combinations, loud colors, decorative gradients and dated typography.
- **Constraints:**
  - The product photography is red meat. The UI has to make those photos stand out, not compete with them.
  - Red has to stay available for sale prices and errors.
  - The admin needs a full set of status colors.
  - Everything has to work in light and dark mode, and in English and Japanese.

## 2. Directions evaluated

The three directions below were built as the same mock screen: header, hero, two product tiles, an admin sidebar with a KPI and status badges, a focused input and body copy. They were rendered side by side and compared.

| | A · Heritage Oxblood *(previous)* | **B · Pasture & Brass** *(chosen, then revised)* | C · Steakhouse Noir |
|---|---|---|---|
| Palette | Oxblood `#7A1F2B`, cream, ink | Forest `#234230`, parchment `#F7F4EE`, brass `#8A672D`/`#C9A45C`, ink | Charcoal `#121110`, brass `#C9A45C`, bone |
| Type | Playfair Display + DM Sans | Fraunces + Manrope | Cormorant Garamond + Inter |
| Brand fit | 4 | **5** | 4 |
| Product photos stand out | 2 (red UI on red meat) | **5** (green is red's complement) | 4 |
| Freshness and trust | 2 | **5** | 2 |
| Distinctiveness | 3 | **4** | 2 (black and gold is the standard wagyu-shop look) |
| Usability and accessibility | 3 (the primary color clashes with sale/error red) | **5** | 2 (dark-first long reads, thin serif at small sizes) |
| Admin dashboard | 3 | **5** | 3 |
| Longevity | 3 | **4** | 3 |
| **Total (of 35)** | 20 | **33** | 20 |

**Why B won:**

- Deep green is the complementary color to red meat, so product tiles stand out instead of blending into the UI.
- Green signals pasture and grass-fed provenance. It is also a traditional color for heritage butchers' shopfronts, along with dark green tiles.
- Moving the brand color off red leaves red free for sale prices and errors, so those signals stay unambiguous.
- It avoids the standard black-and-gold wagyu look.

**Known risk and how it is handled:** food-packaging research links red and warm colors with appetite, and green with health. The design handles this as follows:

- Green is used only on main buttons, never on or over the food.
- Photo overlays are warm black (`--scrim`), never tinted green.
- The parchment and ink neutrals keep the surroundings warm.
- The photography carries the appetite appeal.

**Fonts:**

- **Headings:** *Fraunces* is a variable serif with an optical-size axis from 9 to 144. It has the soft warmth of classic grocer and butcher signage, but it is drawn for screens. The optical-size axis keeps 72px headlines refined and 17px product names sturdy.
  - Playfair Display was rejected: its hairlines break up at small sizes and it is overused.
  - Cormorant was rejected as too delicate below 20px.
  - Instrument Serif was rejected because it has only one weight.
- **Body and UI:** *Manrope* stays crisp at 13–16px and has a tall x-height. Its tabular figures work well for prices, tables and KPIs, and it has more character than Inter.
  - Plus Jakarta Sans was a close second, but it set wider and wrapped the header wordmark in the test.
  - DM Sans read as "basic", matching the client feedback.
  - Inter is the generic SaaS default.
- **Japanese:** Noto Serif JP for headings and Noto Sans JP for text, in the same roles as the Latin fonts.

## 3. Revision: two colors plus one pop

The palette was then checked against a widely shared rule for palettes that look expensive: two base colors that get along, one color that doesn't, and that one goes only on the button. The reference the team shared gives three examples: cream `#F3EEE3` and ink black `#111111` with burnt orange `#D9541E`; navy `#0F1B3D` and white with hot pink `#FF3D8B`; charcoal `#1E1E1C` and sand `#D8CBB3` with electric blue `#2F6BFF`.

**What the check found:**

- The base already matched. Parchment `#F7F4EE` and ink `#1C1B18` are almost the same as the reference's cream and ink black.
- The green didn't pop. Forest `#234230` had an OKLCH chroma of 0.05, against 0.18–0.23 for the reference's pop colors. It was also dark enough to read as a third dark neutral next to ink. The most saturated color in the interface was actually the sale red.
- Green was used well beyond buttons: links, active navigation, selected states, toggles, badges, icons, the footer and the admin sidebar.
- Brass added a fourth color.

**What changed:**

- **The pop:** the green moved to pasture `#0F7A39`, with a chroma of 0.135 (nearly three times the old forest). It is now used on main buttons only.
- **Everything else is parchment or ink:**
  - Links are underlined ink.
  - Tabs, selected sizes and filters, checked controls, and the "New" and "paid" badges are ink pills.
  - The footer and the admin sidebar are ink instead of deep forest.
- **Brass is gone:**
  - Eyebrows are muted ink.
  - Stars and rating bars are ink.
  - The Wagyu label is set in the display italic on a dark photo label.
- **Dark mode lost its green tint.** The canvas is a warm near-black, and the pop becomes a lighter green, `#5AC576`, with dark text.

**Why green and not the reference's burnt orange:**

- In the reference's examples, every photo is black and white, so the pop color is the only saturated thing on screen. Here the product photos are red meat, which is already warm and saturated. An orange button would blend into them. Green, red's complement, is the color that doesn't get along.
- Orange would sit next to the red sale prices and weaken both signals.
- White text on `#D9541E` has a contrast ratio of 4.0:1, below the 4.5:1 minimum for button labels. Hot pink is 3.3:1.

**Trade-off:** the brighter green takes the button label from 10.4:1 to 5.4:1. That is still above the 4.5:1 AA minimum, but no longer AAA. A green bright enough to pop can't keep white text at 7:1.

## 4. Color

### Brand palette (raw values; components never use these directly)

| Token | Hex | Role |
|---|---|---|
| `--stone-50` | `#F7F4EE` | **Base 1, parchment:** page canvas |
| `--stone-0` | `#FFFEFB` | Cards, inputs, popovers |
| `--stone-100` / `-200` | `#EFEAE1` / `#E3DCD0` | Muted fills and highlighted items / hairline borders |
| `--stone-400` | `#958B7C` | Form-control borders (3:1) |
| `--stone-600` | `#5F584E` | Secondary text, eyebrows |
| `--stone-900` | `#1C1B18` | **Base 2, ink:** text, links, icons, ink pills, footer, dashboard sidebar |
| `--stone-800` | `#2E2B27` | Raised ink: the active sidebar item |
| `--pasture-600` | `#0F7A39` | **Pop:** main buttons only |
| `--pasture-700` | `#046A2F` | Main button hover |
| `--brick-600` | `#A3392A` | Signal, not palette: sale prices, destructive actions, errors |

### Semantic tokens (these are what components use)

Each token is exposed as a Tailwind utility, for example `bg-primary` or `text-foreground-muted`. Light mode is the default. `[data-theme="dark"]` redefines every token.

| Group | Tokens | Light | Dark |
|---|---|---|---|
| Canvas | `background` · `surface` · `surface-raised` | parchment · warm white · stone | `#141311` · `#1C1B18` · `#262420` |
| Text | `foreground` · `foreground-muted` | ink · warm grey | ivory `#EFEAE0` · warm grey `#A8A196` |
| Lines | `border` (hairline) · `input` (controls, 3:1) | | |
| Pop | `primary` · `primary-hover` · `primary-foreground` | pasture green + white | `#5AC576` + dark text |
| Ink surfaces | `surface-inverse` (+`-raised`) · `foreground-inverse` (+`-muted`) · `border-inverse` | ink | near-black `#0D0C0B` |
| Commerce | `sale` · `sale-foreground` | brick + white | salmon + dark |
| Status | `success` · `warning` · `danger` · `info`, each with `-foreground`, `-soft` and `-soft-foreground` | green · amber · brick · slate | lightened equivalents |
| Photo | `scrim` · `on-scrim` | warm black · ivory (same in both themes) | |
| Charts | `chart-1` … `chart-5` · `chart-grid` | green · ochre · slate · clay · plum | lifted equivalents |

**Removed in the revision:**

- `primary-soft`: selection tints became `surface-raised` or an ink pill.
- `accent`, `accent-bright`, `accent-inverse`: brass details became ink.
- `premium`, `premium-foreground`: the gold Wagyu label became `on-scrim` on `scrim`.

**Status mapping for orders:**

| Status | Color |
|---|---|
| paid | ink pill |
| packing | warning |
| shipped | info |
| delivered | success |
| cancelled | neutral |
| refunded | danger |

**Stock levels:** out of stock uses `danger`; low stock uses `warning`.

**Charts:** the five categorical slots are always used in this fixed order. They were validated in both modes for color-vision deficiency separation, lightness band, chroma and contrast against `surface`. A single-series chart uses `chart-1`. Status colors are never reused as series colors. The chart palette is data, not decoration, so the two-plus-one rule doesn't apply to it.

### Contrast (WCAG 2.2)

Run `npm run check:contrast` after any color change. It reads the token values straight from `globals.css`, checks 42 foreground/background pairs in each theme, and exits with an error if any pair falls below its minimum. When a new color combination is used, add it to the list in `scripts/check-contrast.mjs`.

Current results (every pair passes, in both themes):

- Body text, links, stars and icons on any surface: at least 14.3:1 in light mode, 12.9:1 in dark mode (AAA).
- Muted text and eyebrows: at least 5.8:1 in light mode, 6:1 in dark mode.
- Ink pills (active tab, selected size and filter, "New" and "paid" badges): 15.6:1 in light mode, 15.4:1 in dark mode.
- Main button label: 5.4:1 in light mode (6.7:1 on hover), 8.5:1 in dark mode.
- Main button against the canvas: 4.9:1 in light mode, 8.5:1 in dark mode. On the photo hero: 3.4:1 in light mode, 8.6:1 in dark mode.
- Sale, error, success, warning and info text: 4.9:1 or more.
- Text on each soft status background: 6.7:1 or more.
- Text in the footer and sidebar: 12.1:1 or more for normal text, 6.2:1 or more for muted text.
- Form-control borders and the focus ring: 3:1 or more.
- Chart series against the card surface: 3.3:1 or more.

## 5. Typography

| Role | Font | Size | Weight / tracking |
|---|---|---|---|
| Hero | Fraunces | 48 → 72px (`text-5xl sm:text-7xl`), line-height 1.02 | 600 / −0.025em |
| Page title (H1) | Fraunces | 36px (`text-4xl`); dashboards 24px | 600 / −0.015em |
| Section (H2) | Fraunces | 30 → 36px (`text-3xl sm:text-4xl`) | 600 / −0.015em |
| Card and product name (H3) | Fraunces | 17–20px | 600 |
| Eyebrow | Manrope | 12px uppercase (`eyebrow` utility) | 700 / +0.16em, `text-foreground-muted` (`text-on-scrim/80` on photos) |
| Body | Manrope | 16px, line-height 1.6 (1.8 in Japanese) | 400 |
| UI and small | Manrope | 15px (`text-sm`) / 13px (`text-xs`) | 500 |
| Labels and buttons | Manrope | 15px | 600 |
| Prices and KPIs | Manrope, `tabular-nums` | 17px on tiles, 30px on product pages and KPIs | 700 |
| Wagyu label | Fraunces italic | 13px | 600 |

Notes:

- The two smallest steps are raised: `text-xs` is 13px and `text-sm` is 15px. Nothing in the UI is set below 11px, and that size is used only for uppercase badges.
- `.font-display` defaults to weight 600 with slightly tight tracking. Utilities such as `font-medium` still override it.
- In Japanese, display tracking turns positive and body line-height increases.

## 6. Rules

1. **Use semantic utilities only.** Use `bg-primary`, `text-foreground-muted`, `bg-danger-soft` and so on. Tailwind's default palette is disabled in `globals.css`, so `bg-red-500` and hex values in components don't exist.
2. **Two plus one.**
   - Parchment and ink carry the whole interface.
   - Pasture green is the one pop color. It goes only on main action buttons (the `Button` `primary` variant: Add to cart, Checkout, Sign in, Save).
   - Use one main button per decision, so a screen shows very little green.
3. **Everything else is ink.**
   - Links are underlined ink.
   - Tabs, selected sizes, selected filters (the `Button` `ink` variant), checked checkboxes and switches, progress bars, stars and icons are ink.
   - Highlighted menu items and hovered rows use `surface-raised`.
4. **Red means money or danger.** Use it only for sale prices and badges, destructive actions and errors.
5. **Status colors describe state.** Use them only for order, stock and alert state, and always pair them with a label or icon.
6. **Surfaces have a fixed order:**
   - `background` is the canvas.
   - `surface` is for cards, inputs and popovers.
   - `surface-raised` is for table headers, muted fills and highlighted items.
   - `surface-inverse` (ink) is for the dashboard sidebar and the footer.
7. **Photos get warm overlays.** Use `from-scrim/…` overlays and `text-on-scrim` for text on photos. Never tint food green. On a photo, the main action is still the `primary` button; secondary actions use `inverse` or `inverseOutline`.
8. **Focus is always visible.** Use a 2px `ring` (ink, or ivory in dark mode) with a 2px offset on buttons and controls, and a `ring-ring/20` halo on inputs. On ink surfaces, use `ring-foreground-inverse`.
9. **Charts follow fixed rules.**
   - Series take `chart-1` to `chart-5` in order.
   - The grid is a solid hairline.
   - An area chart uses its line color at 10% opacity as a wash.
   - There is a crosshair tooltip and a table for screen readers.
   - The title names a single series, so it needs no legend.
