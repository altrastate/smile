import { defineConfig, devices } from "@playwright/test";
import { execSync } from "node:child_process";

function localStatus() {
  const raw = execSync("supabase status -o env", { encoding: "utf8", windowsHide: true });
  const values = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line);
    if (match) {
      values.set(match[1], match[2]);
    }
  }
  const apiUrl = values.get("API_URL") ?? "";
  const publishable = values.get("PUBLISHABLE_KEY") || values.get("ANON_KEY") || "";
  if (!apiUrl.startsWith("http://127.0.0.1:") || publishable.length < 20) {
    throw new Error("Browser tests require the local Supabase stack.");
  }
  return { apiUrl, publishable };
}

const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;
const local = localStatus();

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 300_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishable,
    },
  },
});
