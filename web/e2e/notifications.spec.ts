import { expect, test } from "@playwright/test";
import { ADMIN } from "./constants";
import {
  createEmployeeViaApi,
  employeePayload,
  leaveWindow,
  openSession,
  uniqueEmail,
} from "./helpers";

test.describe.configure({ mode: "serial" });

const nour = employeePayload(uniqueEmail("nour"), {
  firstName: "Nour",
  lastName: "Adel",
  position: "Support Engineer",
});
const reason = `Notification trip ${Date.now()}`;

type Session = Awaited<ReturnType<typeof openSession>>;
let admin: Session;
let nourSession: Session;

test.beforeAll(async ({ browser }) => {
  admin = await openSession(browser, ADMIN, "admin");
  await createEmployeeViaApi(admin.context, nour);
  nourSession = await openSession(browser, nour, "employee");
});

test.afterAll(async () => {
  await Promise.all(
    [admin, nourSession].map((session) => session.context.close()),
  );
});

test("the admin is notified of a new leave request and opens it", async () => {
  const window = leaveWindow();
  const response = await nourSession.context.request.post("/api/leave", {
    data: {
      type: "ANNUAL",
      startDate: window.start,
      endDate: window.end,
      reason,
    },
  });
  expect(response.status()).toBe(201);

  const { page } = admin;
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /^Notifications/ }).click();

  const panel = page.getByRole("dialog", { name: "Notifications panel" });
  await panel.getByText(/Nour Adel requested annual leave/).click();

  await expect(page).toHaveURL(/\/leave$/);
});

test("the admin approves the request", async () => {
  const { page } = admin;
  const row = page.getByRole("row").filter({ hasText: reason });
  await row.getByRole("button", { name: "Approve leave" }).click();

  await expect(row).toContainText("APPROVED");
});

test("the employee sees the decision and clears it", async () => {
  const { page } = nourSession;
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Notifications, \d+ unread/ }).click();

  const panel = page.getByRole("dialog", { name: "Notifications panel" });
  await expect(panel.getByText("Leave approved")).toBeVisible();

  await panel.getByRole("button", { name: "Mark all as read" }).click();
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toBeVisible();

  await panel.getByRole("link", { name: "View all" }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(
    page.getByRole("heading", { name: "Notifications", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Leave approved")).toBeVisible();

  await page.getByRole("button", { name: "Unread" }).click();
  await expect(page.getByText("You are all caught up")).toBeVisible();
});
