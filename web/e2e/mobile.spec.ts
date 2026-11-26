import { expect, test } from "@playwright/test";
import { ADMIN } from "./constants";
import {
  createEmployeeViaApi,
  employeePayload,
  loginViaApi,
  uniqueEmail,
} from "./helpers";

const ADMIN_PAGES = [
  "/dashboard",
  "/employees",
  "/leave",
  "/payslips",
  "/settings",
  "/analytics",
  "/audit-log",
  "/notifications",
];

test.describe("mobile layout", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN, "admin");
  });

  for (const path of ADMIN_PAGES) {
    test(`${path} fits the screen without sideways scrolling`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();

      const pageOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const contentOverflow = await page
        .locator("main")
        .evaluate((element) => element.scrollWidth - element.clientWidth);

      expect(pageOverflow).toBeLessThanOrEqual(0);
      expect(contentOverflow).toBeLessThanOrEqual(0);
    });
  }

  test("opens the menu from the top bar and closes it after navigating", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const menu = page.locator("aside.lg\\:hidden");
    await expect(menu).toHaveClass(/-translate-x-full/);

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(menu).toHaveClass(/translate-x-0/);

    await menu.getByRole("link", { name: "Employees" }).click();
    await expect(page).toHaveURL(/\/employees$/);
    await expect(menu).toHaveClass(/-translate-x-full/);
  });

  test("shows the page title below the top bar instead of behind the menu button", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const button = await page
      .getByRole("button", { name: "Open menu" })
      .boundingBox();
    const title = await page
      .getByRole("heading", { name: "Dashboard" })
      .boundingBox();

    expect(button).not.toBeNull();
    expect(title).not.toBeNull();
    expect(title!.y).toBeGreaterThanOrEqual(button!.y + button!.height);
  });

  test("keeps the employee form scrollable down to its submit button", async ({
    page,
  }) => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "Add Employee" }).click();

    const submit = page
      .getByRole("dialog")
      .getByRole("button", { name: "Create Employee" });
    await submit.scrollIntoViewIfNeeded();

    await expect(submit).toBeInViewport();
  });

  test("shows edit and delete buttons without hovering", async ({
    page,
    context,
  }) => {
    const payload = employeePayload(uniqueEmail("touch"), {
      firstName: "Touch",
      lastName: "User",
    });
    await createEmployeeViaApi(context, payload);

    await page.goto("/employees");

    await expect(
      page.getByRole("button", { name: "Edit Touch User" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete Touch User" }),
    ).toBeVisible();
  });
});
