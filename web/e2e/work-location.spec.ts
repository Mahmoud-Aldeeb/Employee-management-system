import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ADMIN, BASE_URL } from "./constants";
import {
  createEmployeeViaApi,
  employeePayload,
  loginViaApi,
  openSession,
  uniqueEmail,
} from "./helpers";

test.describe.configure({ mode: "serial" });

const OFFICE = { latitude: 30.0444, longitude: 31.2357 };
const FAR_AWAY = { latitude: 30.0544, longitude: 31.2357 };
const NAME = "E2E Office";

const karim = employeePayload(uniqueEmail("karim"), {
  firstName: "Karim",
  lastName: "Zaher",
});

type Session = Awaited<ReturnType<typeof openSession>>;
let admin: Session;
let staff: { context: BrowserContext; page: Page };

async function removeLeftovers() {
  const response = await admin.context.request.get("/api/workplaces");
  const rows = (await response.json()) as { id: string; name: string }[];
  for (const row of rows.filter((item) => item.name === NAME)) {
    await admin.context.request.delete(`/api/workplaces/${row.id}`);
  }
}

test.beforeAll(async ({ browser }) => {
  admin = await openSession(browser, ADMIN, "admin");
  await removeLeftovers();
  await createEmployeeViaApi(admin.context, karim);

  const context = await browser.newContext({
    baseURL: BASE_URL,
    permissions: ["geolocation"],
    geolocation: { ...FAR_AWAY, accuracy: 10 },
  });
  await loginViaApi(context, karim, "employee");
  staff = { context, page: await context.newPage() };
});

test.afterAll(async () => {
  await removeLeftovers();
  await Promise.all([admin.context.close(), staff.context.close()]);
});

test("the admin adds a work location from settings", async () => {
  const { page } = admin;
  await page.goto("/settings");

  const section = page.getByRole("region", { name: "Work locations" });
  await section.getByRole("button", { name: "Add location" }).click();
  const dialog = page.getByRole("dialog", { name: "Add work location" });
  await dialog.getByLabel("Name").fill(NAME);
  await dialog.getByLabel("Latitude").fill(String(OFFICE.latitude));
  await dialog.getByLabel("Longitude").fill(String(OFFICE.longitude));
  await dialog.getByRole("button", { name: "Save location" }).click();

  await expect(dialog).toBeHidden();
  await expect(section.getByText(NAME)).toBeVisible();
  await expect(section.getByText(/150 m radius/)).toBeVisible();
});

test("an employee far from the office is refused with the distance", async () => {
  const { page } = staff;
  await page.goto("/attendance");
  await expect(page.getByText(`Clock in from ${NAME}`)).toBeVisible();

  await page.getByRole("button", { name: "Clock In" }).click();

  const refusal = page
    .getByRole("alert")
    .filter({ hasText: "You are not at a work location" });
  await expect(refusal).toBeVisible();
  await expect(refusal).toContainText(`from ${NAME} (allowed 150 m)`);
  await expect(page.getByRole("button", { name: "Clock In" })).toBeEnabled();
});

test("at the office the employee clocks in and the location is recorded", async () => {
  const { page, context } = staff;
  await context.setGeolocation({ ...OFFICE, accuracy: 10 });

  await page.getByRole("button", { name: "Clock In" }).click();

  await expect(page.getByRole("button", { name: "Clock Out" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: NAME })).toBeVisible();
});

test("the admin removes the location", async () => {
  const { page } = admin;
  await page.goto("/settings");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Delete ${NAME}` }).click();

  await expect(page.getByText("Location deleted")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Work locations" }).getByText(NAME),
  ).toHaveCount(0);
});
