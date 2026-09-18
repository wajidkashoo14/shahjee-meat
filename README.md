# Whole Cuts

A bilingual (English / Japanese) online butcher shop built with Next.js 16,
React 19, Tailwind v4, Drizzle + SQLite, Better Auth, and Stripe. Includes a
full customer dashboard and admin dashboard. See [BUILD_PROMPT.md](../BUILD_PROMPT.md)
for the original spec and [DECISIONS.md](./DECISIONS.md) for every place
this build simplified something and why.

## Quickstart

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/en`. No `.env` setup
is required to get a fully working app (see `.env.example` for optional
extras like Stripe, Google/LINE login, and Resend).

### Demo accounts

Printed again at the end of `npm run db:seed`. Password for all three: `password123`.

| Email | Role |
|---|---|
| `customer@wholecuts.example` | customer — has order history, a subscription, wishlist items, and points |
| `staff@wholecuts.example` | staff — can access most of `/admin` |
| `admin@wholecuts.example` | admin — full access, including discounts and role management |

Two promo codes are seeded: `WELCOME10` (10% off, min ¥3,000) and `FREESHIP`
(free shipping, min ¥5,000).

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict.
- **Styling:** Tailwind CSS v4, hand-rolled shadcn-style components on Radix primitives.
- **Database:** SQLite (better-sqlite3) via Drizzle ORM — see [DECISIONS.md](./DECISIONS.md) for why, and how to swap to Postgres.
- **Auth:** Better Auth (email/password, magic link, password reset, Google OAuth when configured, role-based access via the `admin` plugin).
- **Payments:** Stripe Payment Element + PaymentIntents, with a test-payment fallback when no Stripe key is configured.
- **i18n:** next-intl, locales `en` / `ja`, always-prefixed routes (`/en/...`, `/ja/...`).
- **State:** Zustand for cart/UI drawer state, nuqs for collection filter/sort state in the URL, server actions for all mutations.
- **Email:** Resend when configured, otherwise logged to the server console.
- **Charts:** Recharts (admin revenue chart).
- **Tests:** Vitest (unit — pricing/tax/shipping/delivery/util logic) + Playwright (one E2E smoke spec).

## Project structure

```
src/
  app/[locale]/(shop)/...      storefront: home, collections, product, cart, checkout, recipes, search, legal pages
  app/[locale]/(auth)/...      sign-in, sign-up, forgot/reset password
  app/[locale]/account/...     customer dashboard
  app/[locale]/admin/...       admin dashboard
  app/api/auth/[...all]        Better Auth handler
  app/api/webhooks/stripe      Stripe webhook (signature-verified)
  components/ui/               hand-rolled shadcn-style primitives (button, dialog, sheet, tabs, ...)
  components/{shop,cart,checkout,account,admin,auth,layout}/
  db/schema/*.ts                Drizzle schema, split by domain (auth, catalog, commerce, engagement, content, system)
  db/seed.ts                    seeds ~48 products, collections, reviews, Q&A, recipes, orders, discounts, settings
  lib/                          framework-agnostic helpers (auth config, pricing, tax, shipping, delivery dates, email)
  server/                       DB queries + business logic (cart, orders, catalog, admin, account)
  server/actions/               "use server" mutations, grouped by feature
  i18n/                         next-intl config, routing, navigation
messages/{en,ja}.json           all UI copy
```

## Scripts

```bash
npm run dev          # start the dev server (Turbopack)
npm run build        # production build
npm run start        # run the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest (unit tests)
npm run test:e2e     # playwright (requires: npx playwright install --with-deps, and the dev server seeded)
npm run db:generate  # generate a new Drizzle migration from schema changes
npm run db:migrate   # apply migrations
npm run db:push      # push schema directly (skips migration files — dev convenience)
npm run db:seed      # wipe and reseed the database with demo data
npm run db:studio    # Drizzle Studio (visual DB browser)
```

## Verifying it end-to-end

1. **Buyer flow:** browse `/en/collections/beef` → open a product → pick a
   weight → Add to cart → Checkout → fill the address (try postal code
   `150-0001`, it auto-fills prefecture/city via the zipcloud API) → place
   the test-payment order → land on the confirmation page.
2. **Customer dashboard:** sign in as `customer@wholecuts.example` → `/account`
   shows the order you just placed (or the seeded ones), points balance,
   subscription, wishlist, addresses.
3. **Admin dashboard:** sign in as `admin@wholecuts.example` → `/admin` shows
   real revenue/order KPIs computed from the DB → `/admin/orders` → open the
   order you placed → **Fulfill** it with a tracking number (this sends a
   "shipping notification" email, logged to the terminal) → refresh the
   customer's order page to see the status update live.
4. Switch languages with the globe icon in the header — the whole storefront
   and customer dashboard are translated; the admin panel is English-only
   (see DECISIONS.md).

## Deploying for real

- Swap SQLite → Postgres (see DECISIONS.md) and point `DATABASE_URL` at Neon or any Postgres host.
- Set `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` and move order finalization into the webhook handler (`src/app/api/webhooks/stripe/route.ts`).
- Set `RESEND_API_KEY` for real transactional email.
- Set a strong `BETTER_AUTH_SECRET` and real `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL`.
- Replace the picsum.photos placeholder images with real product photography.
