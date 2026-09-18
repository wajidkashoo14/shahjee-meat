# Decisions & simplifications

This file records every place the build deviated from the literal spec in
`BUILD_PROMPT.md`, and why. The goal throughout was: ship something that
runs end-to-end with zero paid accounts, and keep every corner honest about
what's simplified rather than silently stubbing it out.

## Database: SQLite instead of Postgres/Neon

The spec calls for Postgres via Neon. This build uses **SQLite via
better-sqlite3 + Drizzle**, so `npm install && npm run db:migrate && npm run
db:seed && npm run dev` works with no account, no connection string, and no
network dependency. The schema is plain Drizzle (`src/db/schema/*.ts`) with
no SQLite-only tricks beyond the dialect itself, so moving to Postgres is:
swap `drizzle-orm/better-sqlite3` → `drizzle-orm/node-postgres` (or the Neon
serverless driver) in `src/db/index.ts`, change `dialect: "sqlite"` →
`"postgresql"` in `drizzle.config.ts`, and re-run `db:generate`. Money is
already stored as integer JPY throughout, which works identically in both.

## Collections are materialized, not evaluated live

A "rule" collection (e.g. Grass-fed Beef) is defined by a tag, but the
`product_collections` join rows are computed once — at seed time, or via
`syncRuleCollectionsForProduct()` whenever admin creates/updates a product —
rather than re-evaluated on every collection-page request. This keeps every
collection read a single join regardless of whether it's "manual" or
"rule"-based, at the cost of needing that sync call wired into every
product-mutating code path (it's called from `saveProductAction`).

## Payments: Stripe is real, but optional

Stripe Payment Element + PaymentIntents are fully wired
(`src/server/actions/payment-actions.ts`, `src/components/checkout/stripe-payment-section.tsx`),
including a webhook route with real signature verification
(`src/app/api/webhooks/stripe/route.ts`). But since this environment has no
Stripe account, checkout **falls back to a "test payment" button** whenever
`STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` aren't set — it
calls the exact same `placeOrderAction` a real Stripe confirmation would,
just with `paymentMethod: "test"`. This is what makes the whole buyer
journey (browse → cart → checkout → order → dashboard → admin fulfillment)
runnable out of the box. Order finalization currently happens client-side
on `stripe.confirmPayment` success rather than from the webhook, because a
local dev server has no public URL for Stripe to call back to without the
Stripe CLI's `listen --forward-to`; moving finalization into the webhook
handler is the natural next step for a real deployment (Konbini payments in
particular are asynchronous and *need* the webhook path, since there's no
client-side "success" moment to hook).

## Auth: email/password + magic link fully wired; 2FA, passkeys, and LINE are stubs

Better Auth is configured with `emailAndPassword` (+ real password reset
email flow) and the `magic-link` and `admin` plugins. Google OAuth activates
automatically when `GOOGLE_CLIENT_ID`/`SECRET` are set. LINE login is wired
through `generic-oauth` + better-auth's built-in `line()` helper, gated the
same way — but is genuinely untested since it needs a real LINE Developers
channel. **Two-factor auth and passkeys are not implemented.** They're
real, well-supported Better Auth plugins, but each brings a full UI surface
(QR enrollment, backup codes, WebAuthn ceremonies) that wasn't worth the
scope for a demo whose core value is the storefront + both dashboards. The
`role` field (customer/staff/admin) and RBAC are fully real, not stubbed.

## Search: SQL `LIKE`, not full-text

The spec calls for Postgres full-text search + `pg_trgm`. This SQLite build
uses simple `LIKE '%query%'` matching (`src/server/search.ts`) across name,
tags and cut. It's fine for ~50 seeded products; a real deployment on
Postgres should switch to `tsvector`/`pg_trgm` as originally specced.

## Images: picsum.photos placeholders

Every product/collection/recipe image is a deterministic
`picsum.photos/seed/<slug>/...` URL rather than a real product photo or an
uploaded file. There's no upload pipeline (Vercel Blob / R2) — admin's
"image" field is a plain URL text input. picsum.photos is also a public,
rate-limited third party; a production build should replace this with real
photography behind `next/image` + actual object storage.

## Email: console-logged by default

`src/lib/email.ts` sends through Resend when `RESEND_API_KEY` is set, and
otherwise logs the subject/body to the server console. Every flow that
"sends an email" (magic link, password reset, order confirmation, shipping
notification, inquiry auto-reply) really does call this function — nothing
is silently skipped, it just prints instead of delivering when unconfigured.

## Not implemented / hand-waved

- **Inngest, Upstash Redis, Sentry, PostHog** — not wired in. Background
  jobs (abandoned-cart, review-request emails) don't run; there's no rate
  limiting beyond what Better Auth does internally; no error/analytics
  telemetry.
- **File uploads** — no Tiptap rich-text editor for recipes/product
  descriptions (they're plain textareas storing markdown-ish text), no
  drag-to-reorder product images, no CSV import/export for products.
- **Playwright E2E** — one real spec exists
  (`tests/e2e/checkout-flow.spec.ts`) covering browse → cart → guest
  checkout → order-in-account → admin-fulfillment, matching every step this
  build was manually verified against in-browser. It wasn't run in this
  sandbox (no outbound network access to download a Chromium binary), so
  treat it as reviewed-by-inspection rather than CI-green; run it once
  locally (`npx playwright install --with-deps && npm run test:e2e`) before
  trusting it in a real CI pipeline.
- **Accessibility: `<Label>`/input association** — the primary conversion
  forms (sign in, sign up, forgot/reset password, checkout, account
  profile/password, contact, bulk-inquiry) have proper `htmlFor`/`id`
  pairs. Six admin-only dialogs (collections, discounts, order
  fulfill/refund, inventory adjust, store settings) still render `<Label>`
  next to an input without linking them — functionally fine for a sighted
  mouse user, but not screen-reader correct. Worth a pass before a real
  launch; grep for `<Label>` (no `htmlFor`) in `src/components/admin/` to
  find them.
- **Admin dashboard is English-only.** The storefront and customer
  dashboard are fully bilingual (EN/JA via next-intl); the admin panel's
  ~250 UI strings are not run through `next-intl` at all. Internal
  tooling was deprioritized versus the customer-facing bilingual
  requirement, which is explicit in the spec.
- **CSV import/export, drag-to-reorder** for admin products — not built.
  Product images are an ordered list of URLs (order = array order), which
  covers "reorderable" in spirit via manual URL-list editing, not drag UI.
- **Konbini** payment shows up as a `payment_method_types` option on the
  Stripe PaymentIntent when Stripe is configured, but the full delayed
  konbini-payment → webhook → order-creation flow isn't exercised (see
  webhook note above) — a real deployment should finalize orders from the
  webhook handler, not client-side, once Konbini is meant to work.

## Why these choices

Every item above was picked so that **the parts a reviewer will actually
click through — storefront, cart, checkout, both dashboards — work for
real, with real server-side pricing/stock/points logic**, rather than
spending the same effort wiring up five paid third-party services that
would sit behind placeholder API keys anyway. Swapping any one of them out
(Postgres, Stripe-only checkout, Resend, real photography) is a scoped,
independent change — none of it is load-bearing for the others.
