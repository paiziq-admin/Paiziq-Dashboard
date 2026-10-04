import { expect, test } from "@playwright/test";
import { installMockApi, login } from "./support/mockApi";

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
});

test("all dashboard routes load against the API contract", async ({ page }) => {
  await login(page);

  const routes: Array<[string, RegExp | string]> = [
    ["/", "Overview"],
    ["/payments", "Payment Feed"],
    ["/payments/pay_1", /pay_1/],
    ["/reviews", "Human Review Queue"],
    ["/policies", "Policies"],
    ["/agents", "Agents"],
    ["/audit", "Audit log"],
    ["/alerts", "Alerts"],
    ["/settings", "Settings"],
  ];

  for (const [path, marker] of routes) {
    await page.goto(path);
    if (path === "/payments/pay_1") {
      await expect(page.getByText(marker).first()).toBeVisible();
      await expect(page.getByText("Event Timeline")).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: marker })).toBeVisible();
    }
  }
});

test("payment and review routes remain contained on a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  for (const path of ["/payments", "/payments/pay_1", "/reviews"]) {
    await page.goto(path);
    await page.locator("[data-screen-label]").waitFor();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
});
