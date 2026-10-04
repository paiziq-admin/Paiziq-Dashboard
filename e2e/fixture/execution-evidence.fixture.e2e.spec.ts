import { expect, test } from "@playwright/test";
import { executionEvidence, evidencePayment } from "../../src/test/fixtures/executionEvidence";
import { installMockApi, login } from "../support/mockApi";

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
  await page.route("http://api.paiziq.test/v1/payments/pay_1", (route) => route.fulfill({
    json: { success: true, data: evidencePayment, error: null },
  }));
});

test("unknown execution stays read-only and preserves exact evidence at desktop, tablet, and phone widths", async ({ page }) => {
  await page.route("http://api.paiziq.test/v1/payments/pay_1/execution", (route) => route.fulfill({
    json: { success: true, data: executionEvidence(), error: null },
  }));
  await login(page);
  await page.goto("/payments/pay_1");
  const evidence = page.getByLabel("Execution evidence", { exact: true });
  await expect(evidence.getByText("Unknown", { exact: true })).toBeVisible();
  await expect(evidence.getByRole("alert")).toContainText("Do not retry this payment");
  await expect(page.getByRole("button", { name: /Mark executed|Mark failed|Retry payment/ })).toHaveCount(0);
  await evidence.getByText("Immutable authorization evidence", { exact: true }).click();
  await evidence.getByText("Execution event history (1)", { exact: true }).click();
  await expect(evidence.getByText("[REDACTED]", { exact: true })).toBeVisible();
  await expect(evidence).not.toContainText("never-display-this-key");
  await expect(evidence.getByText("40.00000001 USD", { exact: true })).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => localStorage.setItem("paiziq.dashboard.theme", value), theme);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(evidence.getByText("Unknown", { exact: true })).toBeVisible();
    await evidence.getByText("Immutable authorization evidence", { exact: true }).click();
    await evidence.getByText("Execution event history (1)", { exact: true }).click();
    for (const width of [1440, 900, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await evidence.evaluate((element) => element.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: test.info().outputPath(`execution-${theme}-${width}.png`) });
    }
  }
});

test("missing and forbidden execution evidence do not replace the payment detail", async ({ page }) => {
  let status = 404;
  await page.route("http://api.paiziq.test/v1/payments/pay_1/execution", (route) => route.fulfill({
    status, json: { success: false, data: null, error: { code: "unavailable", message: "not available" } },
  }));
  await login(page);
  await page.goto("/payments/pay_1");
  await expect(page.getByText("Execution evidence unavailable", { exact: true })).toBeVisible();
  await expect(page.getByText("Payment Information", { exact: true })).toBeVisible();
  await expect(page.getByText("No managed execution claim is recorded", { exact: false })).toHaveCount(0);
  status = 403;
  await page.getByRole("button", { name: "Refresh evidence" }).click();
  await expect(page.getByText("Execution evidence permission denied", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/payments\/pay_1$/);
});
