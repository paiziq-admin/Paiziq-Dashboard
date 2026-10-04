import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// Real SDK -> mock provider -> live hosted ledger/API -> dashboard.
// Never calls a financial provider or uses a manual demo database.
const backend = process.env.PAIZIQ_BACKEND_DIR
  ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../paiziq_backend/files/paiziq");
type Seed = {
  org: { id: string; name: string };
  environment: { id: string; name: string };
  agent: { id: string; name: string };
  confirmed: { payment_id: string; request_id: string; executed: boolean };
  unknown: { payment_id: string; request_id: string; executed: boolean };
  blocked: { payment_id: string; request_id: string; executed: boolean };
  provider_calls: { confirmed: number; unknown: number };
};
let seed: Seed;

test.beforeAll(() => {
  const stdout = execFileSync("make", ["-s", "phase0-demo"], {
    cwd: backend,
    env: { ...process.env, PAIZIQ_ENDPOINT: "http://127.0.0.1:8800", PAIZIQ_API_KEY: "dev-key" },
    encoding: "utf8",
  });
  seed = JSON.parse(stdout) as Seed;
  expect(seed.provider_calls).toEqual({ confirmed: 1, unknown: 1 });
  expect(seed.confirmed.executed).toBe(true);
  expect(seed.unknown.executed).toBe(false);
  expect(seed.blocked.executed).toBe(false);
});

test("live hosted execution evidence shows one charge, held unknown funds, and a blocked budget", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Backend URL").fill("http://127.0.0.1:8800");
  await page.getByLabel("API key").fill("dev-key");
  await page.getByRole("button", { name: "Connect dashboard" }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.getByLabel("Organization").selectOption(seed.org.id);
  await expect(page.getByLabel("Environment")).toHaveValue(seed.environment.id);

  await page.goto(`/payments/${seed.confirmed.payment_id}`);
  const evidence = page.getByLabel("Execution evidence", { exact: true });
  await expect(evidence.getByText("Confirmed", { exact: true })).toBeVisible();
  await expect(evidence.getByText(seed.confirmed.request_id, { exact: true })).toBeVisible();
  await expect(evidence.getByText(/^40(?:\.0+)? USD$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Mark executed|Mark failed|Retry payment/ })).toHaveCount(0);

  await page.goto(`/payments/${seed.unknown.payment_id}`);
  await expect(evidence.getByText("Unknown", { exact: true })).toBeVisible();
  await expect(evidence.getByRole("alert")).toContainText("Do not retry this payment");
  await expect(evidence.getByText(/^20(?:\.0+)? USD · held$/)).toBeVisible();
  await expect(evidence.getByText(/^40(?:\.0+)? USD$/).first()).toBeVisible();
  await expect(evidence.getByText(/^20(?:\.0+)? USD$/).first()).toBeVisible();
  await expect(evidence.getByText(seed.environment.id, { exact: true })).toBeVisible();
  await expect(evidence.getByText(seed.agent.id, { exact: true })).toBeVisible();
  await evidence.getByText("Immutable authorization evidence", { exact: true }).click();
  await expect(evidence.locator("details").filter({ has: page.locator("summary", { hasText: "Immutable authorization evidence" }) }).getByText('"Phase 0 unknown vendor"', { exact: true })).toBeVisible();
  await evidence.getByText(/Execution event history \(/).click();
  await expect(evidence.getByText("execution_unknown", { exact: true })).toBeVisible();
  await evidence.evaluate((element) => element.scrollIntoView({ block: "start" }));
  const screenshotDirectory = process.env.PAIZIQ_DEMO_DIR ?? test.info().outputDir;
  mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDirectory, "phase0-unknown-execution.png") });
  writeFileSync(path.join(screenshotDirectory, "phase0-workflow.json"), JSON.stringify(seed, null, 2));

  await page.goto(`/payments/${seed.blocked.payment_id}`);
  await expect(evidence.getByText("Not started", { exact: true })).toBeVisible();
  await expect(evidence.getByText(/^40(?:\.0+)? USD$/).first()).toBeVisible();
  await expect(evidence.getByText(/^20(?:\.0+)? USD$/).first()).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Payment would exceed daily budget: 110.00 > 100.00 (spent 60.00)" })).toBeVisible();
});
