import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const root = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(process.env.PAIZIQ_BACKEND_DIR
  ?? path.resolve(root, "../paiziq_backend/files/paiziq"));
// Preserve manual demo databases. A run owns its services and refuses occupied ports.
const runDirectory = mkdtempSync(path.join(tmpdir(), "paiziq-service-e2e-"));
const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export default defineConfig({
  testDir: "./e2e/service",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  webServer: [
    {
      command: `make -C ${shellQuote(backend)} e2e-stack`,
      env: { E2E_DB: path.join(runDirectory, "ingest.sqlite") },
      url: "http://127.0.0.1:8800/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
