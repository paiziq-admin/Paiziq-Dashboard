import { execFileSync } from "node:child_process";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

// AC: A simulated payment agent decision, threshold flag, policy version, and
// trace appear in the live dashboard.
// Behavior: SDK agent seeds the local backend -> operator opens feed, detail,
// reviews, and policies -> the same facts are visible.
// @category: service-integration-e2e
// @lane: service-integration-e2e
// @dependency: full-system
// @complexity: high
// ROI: 110

const backend = process.env.PAIZIQ_BACKEND_DIR
  ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../paiziq_backend/files/paiziq");

type Seed = {
  org: { id: string; name: string };
  environment: { id: string; name: string };
  agent: { name: string };
  policy: { name: string; version: number };
  transactions: Array<{ key: string; payment_id: string; merchant: string; state: string; request_id: string; trace_id: string }>;
};

let seed: Seed;
const demoDirectory = process.env.PAIZIQ_DEMO_DIR;
async function capture(page: Page, name: string) {
  if (!demoDirectory) return;
  mkdirSync(demoDirectory, { recursive: true });
  await page.screenshot({ path: path.join(demoDirectory, `${name}.png`), fullPage: true });
}

test.beforeAll(() => {
  const stdout = execFileSync("make", ["-s", "e2e-seed"], {
    cwd: backend,
    env: {
      ...process.env,
      PAIZIQ_ENDPOINT: "http://127.0.0.1:8800",
      PAIZIQ_API_KEY: "dev-key",
    },
    encoding: "utf8",
  });
  seed = JSON.parse(stdout) as Seed;
  if (demoDirectory) {
    mkdirSync(demoDirectory, { recursive: true });
    writeFileSync(path.join(demoDirectory, "workflow.json"), JSON.stringify(seed, null, 2));
  }
});

test("dashboard shows the live payment-agent workflow", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Backend URL").fill("http://127.0.0.1:8800");
  await page.getByLabel("API key").fill("dev-key");
  await capture(page, "01-connect");
  await page.getByRole("button", { name: "Connect dashboard" }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();

  const organization = page.getByLabel("Organization");
  await expect(organization).toBeEnabled();
  if ((await organization.inputValue()) !== seed.org.id) {
    await organization.selectOption(seed.org.id);
  }
  const environment = page.getByLabel("Environment");
  await expect(environment).toContainText(seed.environment.name, { timeout: 15_000 });
  if ((await environment.inputValue()) !== seed.environment.id) {
    await environment.selectOption(seed.environment.id);
  }

  const review = seed.transactions.find((item) => item.key === "t2");
  if (!review) throw new Error("missing t2");

  await capture(page, "02-overview");
  await page.goto("/agents");
  await expect(page.getByText(seed.agent.name, { exact: true })).toBeVisible();
  await capture(page, "03-agent");
  await page.goto("/payments");
  await expect(page.getByText("cloudhost inc")).toBeVisible();
  await expect(page.getByText("acme corp")).toBeVisible();
  await expect(page.getByText("shady llc")).toBeVisible();
  for (const payment of seed.transactions) {
    const row = page.locator(".grid-table-row").filter({ hasText: payment.payment_id });
    await expect(row).toContainText(payment.merchant);
    await expect(row).toContainText({ executed: "Executed", needs_review: "Needs Review", rejected: "Rejected" }[payment.state] ?? payment.state);
  }
  await capture(page, "04-payments");
  const traceResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/v1/traces/${review.trace_id}`),
  );
  await page.getByRole("button", { name: review.payment_id, exact: true }).click();
  await expect(page.getByText("Policy version 1")).toBeVisible();
  await expect(page.getByText("over_review_threshold", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Amount 180.00 exceeds review threshold 100.00; human approval required").first(),
  ).toBeVisible();
  await expect(page.getByText("paiziq.review_payment", { exact: true })).toBeVisible();
  await expect(page.getByText("Needs Review", { exact: true }).first()).toBeVisible();

  const trace = await (await traceResponse).json();
  expect(trace.trace_id).toBe(review.trace_id);
  expect(JSON.stringify(trace.spans)).toContain(review.request_id);
  await capture(page, "05-decision");
  await page.getByLabel("Search trace JSON").fill(review.request_id);
  await expect(page.getByText(JSON.stringify(review.request_id), { exact: true }).first()).toBeVisible();
  await capture(page, "06-trace");

  await page.goto("/reviews");
  await expect(page.getByText(review.payment_id).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Claim", exact: true })).toBeVisible();
  await capture(page, "07-review");

  await page.goto("/policies");
  await expect(page.getByRole("button", { name: new RegExp(seed.policy.name) })).toBeVisible();
  await page.getByRole("button", { name: new RegExp(seed.policy.name) }).click();
  await expect(page.getByLabel("Review threshold")).toHaveValue("100");
  await expect(page.getByText("Active v1", { exact: true })).toBeVisible();
  await capture(page, "08-policy");
  await page.getByRole("button", { name: "Simulator" }).click();
  await page.getByLabel("Merchant").fill("cloudhost inc");
  await page.getByLabel("Amount").fill("180");
  await page.getByLabel("Intent description").fill("Annual CloudHost renewal");
  await page.getByLabel("Policy source").selectOption("version:1");
  await page.getByRole("button", { name: "Simulate decision" }).click();
  await expect(page.getByText("needs review", { exact: true })).toBeVisible();
  await expect(page.getByText("Not persisted", { exact: true })).toBeVisible();
  await expect(page.getByText("Amount 180.00 exceeds review threshold 100.00; human approval required")).toBeVisible();
  await capture(page, "09-simulator");
});
