import { defineConfig, devices } from "@playwright/test";
import {
  ADMIN,
  API_PORT,
  API_URL,
  BASE_URL,
  DB_PORT,
  DB_READY_PORT,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
  MONGODB_URL,
  WEB_PORT,
} from "./e2e/constants";

const reuseServers = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: [
    {
      name: "database",
      command: "node scripts/e2e-db.mjs",
      cwd: "../server-nest",
      url: `http://127.0.0.1:${DB_READY_PORT}`,
      timeout: 240_000,
      reuseExistingServer: reuseServers,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        E2E_DB_PORT: String(DB_PORT),
        E2E_DB_READY_PORT: String(DB_READY_PORT),
        E2E_ADMIN_EMAIL: ADMIN.email,
        E2E_ADMIN_PASSWORD: ADMIN.password,
      },
    },
    {
      name: "api",
      command: "npm run build && node dist/main.js",
      cwd: "../server-nest",
      url: `${API_URL}/api/auth/session`,
      timeout: 240_000,
      reuseExistingServer: reuseServers,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "test",
        PORT: String(API_PORT),
        MONGODB_URL,
        JWT_SECRET,
        JWT_REFRESH_SECRET,
        CLIENT_URL: BASE_URL,
        DEMO_MODE: "true",
      },
    },
    {
      name: "web",
      command: `npm run build && npm run start -- --port ${WEB_PORT}`,
      url: `${BASE_URL}/login`,
      timeout: 300_000,
      reuseExistingServer: reuseServers,
      stdout: "pipe",
      stderr: "pipe",
      env: { API_URL },
    },
  ],
});
