import { expect, test } from "@playwright/test";

test.describe("team calendar", () => {
  test("the admin sees who is out today and filters by department", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();
    await page.getByRole("link", { name: "Team Calendar" }).click();
    await expect(
      page.getByRole("heading", { name: "Team Calendar" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /\(today\)/ }).click();
    const details = page.getByRole("region", { name: /^Out on/ });
    await expect(details.getByText("Tamer Wahba")).toBeVisible();

    await page.getByLabel("Filter by department").selectOption("Engineering");
    await expect(details.getByText("Hana Younes")).toBeVisible();
    await expect(details.getByText("Tamer Wahba")).toHaveCount(0);

    await page.getByLabel("Filter by department").selectOption("Sales");
    await expect(details.getByText("Tamer Wahba")).toBeVisible();
  });

  test("moving to the next month and back keeps the calendar working", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();
    await page.getByRole("link", { name: "Team Calendar" }).click();

    const title = page.getByRole("heading", { level: 2 }).first();
    const current = await title.textContent();

    await page.getByRole("button", { name: "Next month" }).click();
    await expect(title).not.toHaveText(current ?? "");

    await page.getByRole("button", { name: "Today" }).click();
    await expect(title).toHaveText(current ?? "");
    await expect(page.getByRole("button", { name: /\(today\)/ })).toBeVisible();
  });

  test("an employee sees the calendar without the admin filter", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Employee" }).click();
    await page.getByRole("link", { name: "Team Calendar" }).click();

    await expect(
      page.getByRole("heading", { name: "Team Calendar" }),
    ).toBeVisible();
    await expect(page.getByLabel("Filter by department")).toHaveCount(0);
    await expect(
      page.getByText(/without its type, plus your own requests/),
    ).toBeVisible();
  });
});
