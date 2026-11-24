import { expect, test } from "@playwright/test";

test.describe("audit log", () => {
  test("the admin reviews the activity and narrows it down", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();
    await page.getByRole("link", { name: "Audit Log" }).click();
    await expect(
      page.getByRole("heading", { name: "Audit Log" }),
    ).toBeVisible();

    const entries = page.getByRole("region", { name: "Audit entries" });
    await expect(entries.getByText("Admin sign-in").first()).toBeVisible();

    await page.getByLabel("Event type").selectOption("LEAVE_APPROVED");
    await expect(entries.getByText("Admin sign-in")).toHaveCount(0);
    await expect(entries.getByText(/Tamer Wahba/)).toHaveCount(1);
    await expect(entries.getByText(/Khaled Mansour/)).toHaveCount(1);

    await page.getByLabel("Search").fill("Tamer");
    await expect(entries.getByText(/Khaled Mansour/)).toHaveCount(0);
    await expect(entries.getByText(/Tamer Wahba/)).toHaveCount(1);
  });

  test("the activity is paginated", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();
    await page.getByRole("link", { name: "Audit Log" }).click();

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination.getByText(/Page 1 of \d+/)).toBeVisible();

    await pagination.getByRole("button", { name: "Next" }).click();

    await expect(pagination.getByText(/Page 2 of \d+/)).toBeVisible();
    await expect(
      pagination.getByRole("button", { name: "Previous" }),
    ).toBeEnabled();
  });

  test("an employee does not see the audit log", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Employee" }).click();
    await expect(
      page.getByRole("link", { name: "Leave", exact: true }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Audit Log" })).toHaveCount(0);
  });
});
