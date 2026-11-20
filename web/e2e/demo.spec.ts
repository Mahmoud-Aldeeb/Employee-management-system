import { expect, test } from "@playwright/test";

test.describe("demo mode", () => {
  test("explore as admin opens a populated dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Welcome back, Admin")).toBeVisible();
    await expect(page.getByText("Total Employees")).toBeVisible();

    await page.getByRole("link", { name: "Employees" }).click();
    await expect(
      page.getByRole("heading", { name: "Khaled Mansour" }),
    ).toBeVisible();
  });

  test("explore as employee shows the personal dashboard and salary", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Employee" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Welcome, Salma!" }),
    ).toBeVisible();
    await expect(page.getByText("Current Salary")).toBeVisible();
  });
});
