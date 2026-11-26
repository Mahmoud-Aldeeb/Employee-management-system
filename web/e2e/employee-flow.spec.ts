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

const sara = employeePayload(uniqueEmail("sara"), {
  firstName: "Sara",
  lastName: "Ali",
  position: "Designer",
});
const omar = employeePayload(uniqueEmail("omar"), {
  firstName: "Omar",
  lastName: "Nabil",
  position: "Analyst",
});
const reason = `Family trip ${Date.now()}`;

type Session = Awaited<ReturnType<typeof openSession>>;
let admin: Session;
let saraSession: Session;
let omarSession: Session;
let payslipUrl = "";

test.beforeAll(async ({ browser }) => {
  admin = await openSession(browser, ADMIN, "admin");
  await createEmployeeViaApi(admin.context, sara);
  await createEmployeeViaApi(admin.context, omar);
  saraSession = await openSession(browser, sara, "employee");
  omarSession = await openSession(browser, omar, "employee");
});

test.afterAll(async () => {
  await Promise.all(
    [admin, saraSession, omarSession].map((session) => session.context.close()),
  );
});

test("sara clocks in and out", async () => {
  const { page } = saraSession;
  await page.goto("/attendance");

  await page.getByRole("button", { name: "Clock In" }).click();
  await expect(page.getByRole("button", { name: "Clock Out" })).toBeVisible();

  await page.getByRole("button", { name: "Clock Out" }).click();
  await expect(page.getByText("Work Day Completed")).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: /PRESENT|LATE/ }),
  ).toHaveCount(1);
});

test("sara sees her leave balance and the casual leave rule is enforced", async () => {
  const { page } = saraSession;
  await page.goto("/leave");

  const balance = page.getByRole("region", { name: "Leave balance" });
  await expect(balance).toBeVisible();
  await expect(balance.getByText("7 of 7")).toBeVisible();

  const window = leaveWindow(10, 3);
  await page.getByRole("button", { name: "Apply for Leave" }).click();
  const dialog = page.getByRole("dialog", { name: "Apply for Leave" });
  await dialog.getByLabel("Leave Type").selectOption("CASUAL");
  await dialog.getByLabel("From").fill(window.start);
  await dialog.getByLabel("To").fill(window.end);
  await dialog.getByLabel("Reason").fill("Too many casual days");
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "limited to 2 working days per request" }),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("sara applies for leave and sees validation feedback first", async () => {
  const { page } = saraSession;
  await page.goto("/leave");
  await page.getByRole("button", { name: "Apply for Leave" }).click();

  const dialog = page.getByRole("dialog", { name: "Apply for Leave" });
  await dialog.getByLabel("From").fill("2020-01-10");
  await dialog.getByLabel("To").fill("2020-01-12");
  await dialog.getByLabel("Reason").fill(reason);
  await dialog.getByRole("button", { name: "Submit" }).click();
  await expect(
    dialog.getByText("Leave must start tomorrow or later"),
  ).toBeVisible();

  await dialog.getByLabel("Leave Type").selectOption("ANNUAL");
  await dialog.getByLabel("From").fill(leaveWindow().start);
  await dialog.getByLabel("To").fill(leaveWindow().end);
  await dialog.getByRole("button", { name: "Submit" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("row").filter({ hasText: reason })).toContainText(
    "PENDING",
  );
});

test("the admin approves the request", async () => {
  const { page } = admin;
  await page.goto("/leave");

  const row = page.getByRole("row").filter({ hasText: reason });
  await row.getByRole("button", { name: "Approve leave" }).click();

  await expect(row).toContainText("APPROVED");
});

test("sara sees the approved leave", async () => {
  const { page } = saraSession;
  await page.goto("/leave");

  await expect(page.getByRole("row").filter({ hasText: reason })).toContainText(
    "APPROVED",
  );
});

test("the admin generates a payslip and a duplicate is rejected", async () => {
  const { page } = admin;
  await page.goto("/payslips");

  const generate = async () => {
    await page.getByRole("button", { name: "Generate Payslip" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Generate Monthly Payslip",
    });
    await dialog
      .getByLabel("Employee")
      .selectOption({ label: "Sara Ali (Designer)" });
    await dialog.getByLabel("Basic Salary").fill("5000");
    await dialog.getByLabel("Allowances").fill("500");
    await dialog.getByLabel("Deductions").fill("200");
    await expect(dialog.getByText("$5,300")).toBeVisible();
    await dialog.getByRole("button", { name: "Generate" }).click();
    return dialog;
  };

  const first = await generate();
  await expect(first).toBeHidden();
  await expect(
    page.getByRole("row").filter({ hasText: "Sara Ali" }),
  ).toContainText("$5,300");

  const second = await generate();
  await expect(page.getByText("already exists")).toBeVisible();
  await second.getByRole("button", { name: "Cancel" }).click();
});

test("sara opens her payslip and omar cannot see it", async () => {
  const { page, context } = saraSession;
  await page.goto("/payslips");
  await expect(
    page.getByRole("row").filter({ hasText: "$5,300" }),
  ).toBeVisible();

  const [payslipPage] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: "Download" }).click(),
  ]);
  await expect(
    payslipPage.getByRole("heading", { name: "PAYSLIP" }),
  ).toBeVisible();
  await expect(payslipPage.getByText("Sara Ali")).toBeVisible();
  payslipUrl = payslipPage.url();
  await payslipPage.close();

  const other = omarSession.page;
  await other.goto(payslipUrl);
  await expect(other.getByText("Payslip not found")).toBeVisible();

  await other.goto("/payslips");
  await expect(other.getByText("No payslips found")).toBeVisible();
});

test("the admin raises the salary and sara sees it on her dashboard", async () => {
  const { page } = admin;
  await page.goto("/employees");
  await page.getByRole("button", { name: "Edit Sara Ali" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit Employee" });
  await dialog.getByLabel("Basic Salary").fill("6000");
  await dialog.getByRole("button", { name: "Update Employee" }).click();
  await expect(dialog).toBeHidden();

  await saraSession.page.goto("/dashboard");
  await expect(saraSession.page.getByText("Current Salary")).toBeVisible();
  await expect(saraSession.page.getByText("$6,300")).toBeVisible();
});

test("settings: sara updates her bio", async () => {
  const { page } = saraSession;
  await page.goto("/settings");

  await page.getByLabel("Bio").fill("Designing things since 2020");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile updated successfully")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Bio")).toHaveValue(
    "Designing things since 2020",
  );
});
