import { expect, test } from "@playwright/test";
import { ADMIN } from "./constants";
import {
  createEmployeeViaApi,
  employeePayload,
  openSession,
  uniqueEmail,
} from "./helpers";

test.describe.configure({ mode: "serial" });

const email = uniqueEmail("mona");
const password = "Temp#12345";

type Session = Awaited<ReturnType<typeof openSession>>;
let admin: Session;

test.beforeAll(async ({ browser }) => {
  admin = await openSession(browser, ADMIN, "admin");
});

test.afterAll(async () => {
  await admin.context.close();
});

test("creates an employee from the form", async () => {
  const { page } = admin;
  await page.goto("/employees");
  await page.getByRole("button", { name: "Add Employee" }).click();

  const dialog = page.getByRole("dialog", { name: "Add New Employee" });
  await dialog.getByLabel("First Name").fill("Mona");
  await dialog.getByLabel("Last Name").fill("Hassan");
  await dialog.getByLabel("Phone Number").fill("01000000000");
  await dialog.getByLabel("Join Date").fill("2026-01-15");
  await dialog.getByLabel("Department").selectOption("Engineering");
  await dialog.getByLabel("Position").fill("Developer");
  await dialog.getByLabel("Basic Salary").fill("5000");
  await dialog.getByLabel("Work Email").fill(email);
  await dialog.getByLabel("Temporary Password").fill(password);
  await dialog.getByRole("button", { name: "Create Employee" }).click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Mona Hassan" }),
  ).toBeVisible();
});

test("the new employee can sign in and sees a personal dashboard", async ({
  browser,
}) => {
  const session = await openSession(browser, { email, password }, "employee");
  await session.page.goto("/dashboard");

  await expect(
    session.page.getByRole("heading", { name: "Welcome, Mona!" }),
  ).toBeVisible();
  await session.context.close();
});

test("rejects a duplicate email", async () => {
  const { page } = admin;
  await page.goto("/employees");
  await page.getByRole("button", { name: "Add Employee" }).click();

  const dialog = page.getByRole("dialog", { name: "Add New Employee" });
  await dialog.getByLabel("First Name").fill("Copy");
  await dialog.getByLabel("Last Name").fill("Cat");
  await dialog.getByLabel("Phone Number").fill("0100");
  await dialog.getByLabel("Join Date").fill("2026-01-15");
  await dialog.getByLabel("Position").fill("Tester");
  await dialog.getByLabel("Work Email").fill(email);
  await dialog.getByLabel("Temporary Password").fill(password);
  await dialog.getByRole("button", { name: "Create Employee" }).click();

  await expect(page.getByText("Email already exists")).toBeVisible();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("shows field validation messages before sending anything", async () => {
  const { page } = admin;
  await page.goto("/employees");
  await page.getByRole("button", { name: "Add Employee" }).click();

  const dialog = page.getByRole("dialog", { name: "Add New Employee" });
  await dialog.getByRole("button", { name: "Create Employee" }).click();

  await expect(dialog.getByText("First name is required")).toBeVisible();
  await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
  await expect(dialog.getByText("Use at least 8 characters")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("searches employees by name", async () => {
  const { page } = admin;
  await page.goto("/employees");
  const search = page.getByRole("searchbox", { name: "Search employees" });

  await search.fill("Mona");
  await expect(
    page.getByRole("heading", { name: "Mona Hassan" }),
  ).toBeVisible();

  await search.fill("zzz-nobody");
  await expect(page.getByText("No employees found")).toBeVisible();
});

test("edits an employee", async () => {
  const { page } = admin;
  await page.goto("/employees");
  await page.getByRole("button", { name: "Edit Mona Hassan" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit Employee" });
  await dialog.getByLabel("Position").fill("Senior Developer");
  await dialog.getByRole("button", { name: "Update Employee" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Senior Developer")).toBeVisible();
});

test("keeps admin pages away from employees", async ({ browser }) => {
  const lina = employeePayload(uniqueEmail("lina"), {
    firstName: "Lina",
    lastName: "Sami",
  });
  await createEmployeeViaApi(admin.context, lina);
  const session = await openSession(browser, lina, "employee");

  await session.page.goto("/employees");
  await expect(session.page).toHaveURL(/\/dashboard$/);

  await session.page.goto("/analytics");
  await expect(session.page).toHaveURL(/\/dashboard$/);
  await session.context.close();
});

test("deletes an employee after confirmation", async () => {
  const { page } = admin;
  await page.goto("/employees");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Mona Hassan" }).click();

  await expect(page.getByText("Employee deleted")).toBeVisible();
  await expect(page.getByText("DELETED", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Mona Hassan" }),
  ).toHaveCount(0);
});
