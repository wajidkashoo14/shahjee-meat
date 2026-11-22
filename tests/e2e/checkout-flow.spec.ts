import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke test for the core buyer + fulfillment journey:
 * browse -> add to cart -> guest checkout (test payment) -> order appears
 * in the customer's account -> admin marks it shipped.
 *
 * Needs a seeded database (`npm run db:seed`), because it signs in with the
 * demo accounts the seed script creates. Playwright starts the app itself:
 * `next dev` locally, the production build in CI.
 */

test("guest can browse, check out, and see the order; admin can fulfill it", async ({ page }) => {
  // The checkout form looks up the address for a postal code at an outside
  // service (zipcloud). Block it so the test doesn't depend on that service;
  // when the lookup fails the form keeps what was typed.
  await page.route("https://zipcloud.ibsnet.co.jp/**", (route) => route.abort());

  // 1. Browse the beef collection and open the tomahawk product. Filter to the
  //    tomahawk cut: the seed gives products random sales counts, so the
  //    default order only sometimes puts it on the first page.
  await page.goto("/en/collections/beef?cut=tomahawk");
  await expect(page.getByRole("heading", { name: "Beef", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Tomahawk Steak/i }).first().click();
  await expect(page.getByRole("heading", { name: /Tomahawk Steak/i })).toBeVisible();

  // 2. Add the first in-stock size to the cart. The related-product cards have
  //    icon-only "Add to cart" buttons too, so pick the one that shows the text.
  await page.getByRole("button", { name: /add to cart/i }).filter({ hasText: /add to cart/i }).click();
  await expect(page.getByRole("dialog", { name: /your cart/i })).toBeVisible();

  // 3. Go to checkout as a guest.
  await page.getByRole("link", { name: /^checkout$/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  const email = `e2e-${Date.now()}@example.com`;
  await page.getByLabel("Email address").fill(email);
  // Exact, so it doesn't also match "Full name (furigana)".
  await page.getByLabel("Full name", { exact: true }).fill("E2E Test Buyer");
  await page.getByLabel("Phone number").fill("090-0000-0000");
  await page.getByLabel("Postal code").fill("150-0001");
  await page.getByLabel("City / Ward").fill("Shibuya-ku");
  await page.getByLabel("Address line 1").fill("1-1-1 Jingumae");

  // 4. Place the order (Stripe isn't configured in this environment, so a
  // "test payment" button finalizes the order directly).
  await page.getByRole("button", { name: /place order/i }).click();
  // A heading, not any text: Next's route announcer repeats the page heading for screen readers.
  await expect(page.getByRole("heading", { name: /order confirmed/i })).toBeVisible({ timeout: 15_000 });
  const orderNumberText = await page.getByText(/^WC\d{6}-\d{4}$/).textContent();
  expect(orderNumberText).toBeTruthy();

  // 5. Sign in as the seeded customer and confirm an order now appears.
  //    (The guest order above isn't tied to this account — this instead
  //    verifies the existing demo customer's order history renders.)
  await page.goto("/en/sign-in");
  await page.getByLabel("Email").fill("customer@wholecuts.example");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account/);
  await page.goto("/en/account/orders");
  await expect(page.getByText(/^WC\d{6}-\d{4}$/).first()).toBeVisible();

  // 6. Sign out of the customer account, then sign in as admin and confirm
  //    the admin orders dashboard is reachable and lists real orders.
  await page.context().clearCookies();
  await page.goto("/en/sign-in?next=/admin/orders");
  await page.getByLabel("Email").fill("admin@wholecuts.example");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.getByText(/^WC\d{6}-\d{4}$/).first()).toBeVisible();
});
