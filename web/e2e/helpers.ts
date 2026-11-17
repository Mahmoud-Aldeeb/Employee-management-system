import { expect, type Browser, type BrowserContext } from "@playwright/test";
import { BASE_URL } from "./constants";

export interface Credentials {
  email: string;
  password: string;
}

export type Portal = "admin" | "employee";

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}@e2e.test`;
}

export function futureDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function employeePayload(
  email: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    firstName: "Test",
    lastName: "Employee",
    email,
    phone: "01000000000",
    position: "Developer",
    department: "Engineering",
    basicSalary: 5000,
    allowances: 500,
    deductions: 200,
    joinDate: "2026-01-01",
    password: "Temp#12345",
    ...overrides,
  };
}

export async function loginViaApi(
  context: BrowserContext,
  credentials: Credentials,
  portal: Portal,
) {
  const response = await context.request.post("/api/auth/login", {
    data: {
      email: credentials.email,
      password: credentials.password,
      role_type: portal,
    },
  });
  expect(
    response.ok(),
    `API login failed for ${credentials.email}`,
  ).toBeTruthy();
}

export async function openSession(
  browser: Browser,
  credentials: Credentials,
  portal: Portal,
) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  await loginViaApi(context, credentials, portal);
  const page = await context.newPage();
  return { context, page };
}

export async function createEmployeeViaApi(
  adminContext: BrowserContext,
  payload: ReturnType<typeof employeePayload>,
) {
  const response = await adminContext.request.post("/api/employees", {
    data: payload,
  });
  expect(response.status(), `could not create ${payload.email}`).toBe(201);
}
