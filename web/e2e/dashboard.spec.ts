import { expect, test } from "@playwright/test";

test.describe("dashboard", () => {
  test("the admin decides a leave request straight from the dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Admin" }).click();
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    const approvals = page.getByRole("region", { name: "Pending approvals" });
    const requests = approvals.getByRole("listitem");
    await expect(requests.first()).toBeVisible();
    const before = await requests.count();

    await requests
      .first()
      .getByRole("button", { name: /Approve/ })
      .click();

    await expect(requests).toHaveCount(before - 1);
    await expect(
      page
        .getByRole("region", { name: "Who's out today" })
        .getByText("Tamer Wahba"),
    ).toBeVisible();
  });

  test("the employee clocks in from the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Explore as Employee" }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome, Salma!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clock In" }).click();

    await expect(page.getByRole("button", { name: "Clock Out" })).toBeVisible();
  });
});
