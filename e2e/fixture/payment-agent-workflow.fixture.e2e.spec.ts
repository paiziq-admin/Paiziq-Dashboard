import { expect, test } from "@playwright/test";
import { installPaymentAgentFixtures, login } from "../support/paymentAgentFixtures";

// AC: An operator can open a needs_review payment and see the verdict, threshold
// reason, risk flag, policy version, trace, and final status.
// Behavior: Open the payment feed -> open pay_t2 -> those facts are visible.
// @category: fixture-e2e
// @lane: fixture-e2e
// @dependency: dashboard UI, mocked ingest API
// @complexity: medium
// ROI: 110

test.beforeEach(async ({ page }) => {
  await installPaymentAgentFixtures(page);
  await login(page);
});

test("payment detail shows the threshold decision and trace", async ({ page }) => {
  await page.goto("/payments");
  await expect(page.getByRole("heading", { name: "Payment Feed" })).toBeVisible();
  await expect(page.getByText("acme corp")).toBeVisible();
  await expect(page.getByText("cloudhost inc")).toBeVisible();
  await expect(page.getByText("shady llc")).toBeVisible();
  await expect(page.getByText("Needs Review", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "pay_t2", exact: true }).click();
  await expect(page.getByText("Policy version 1")).toBeVisible();
  await expect(
    page.getByText("Amount 180.00 exceeds review threshold 100.00; human approval required").first(),
  ).toBeVisible();
  await expect(page.getByText("over_review_threshold", { exact: true })).toBeVisible();
  await expect(page.getByText("paiziq.review_payment", { exact: true })).toBeVisible();
  await page.getByLabel("Search trace JSON").fill("decision");
  await expect(page.getByText('"decision"', { exact: true })).toBeVisible();
  await expect(page.getByText("Needs Review", { exact: true }).first()).toBeVisible();
});

// AC: Simulating a 180 payment against the threshold policy shows needs_review.
// Behavior: Open Policies simulator -> submit 180 -> needs review and the threshold reason.
// @category: fixture-e2e
// @lane: fixture-e2e
// @dependency: dashboard UI, mocked policy simulate
// @complexity: medium
// ROI: 55
test("policy simulator shows the threshold needs_review result", async ({ page }) => {
  await page.goto("/policies");
  await page.getByRole("button", { name: /e2e-threshold-policy/ }).click();
  await page.getByRole("button", { name: "Simulator" }).click();
  await page.getByLabel("Merchant").fill("cloudhost inc");
  await page.getByLabel("Amount").fill("180");
  const simulation = page.waitForRequest((request) =>
    request.url().endsWith("/v1/policies/simulate") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Simulate decision" }).click();
  expect((await simulation).postDataJSON()).toMatchObject({
    payment: { merchant: "cloudhost inc", amount: 180, currency: "USD" },
    document: { review_threshold: 100, hard_limit: 1000 },
  });
  await expect(page.getByText("needs review")).toBeVisible();
  await expect(
    page.getByText("Amount 180.00 exceeds review threshold 100.00; human approval required"),
  ).toBeVisible();
  await expect(page.getByText("Not persisted")).toBeVisible();
});
