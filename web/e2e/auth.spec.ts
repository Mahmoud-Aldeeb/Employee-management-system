import { expect, test } from "@playwright/test";
import { BASE_URL, ADMIN } from "./constants";

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login/admin");
  await page.getByLabel("Email address").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("authentication", () => {
  test("redirects anonymous visitors from protected pages to the login page", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
  });

  test("shows an error for a wrong password", async ({ page }) => {
    await page.goto("/login/admin");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login\/admin$/);
  });

  test("signs the admin in, keeps the session across reloads and signs out", async ({
    page,
  }) => {
    await signInAsAdmin(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Welcome back, Admin")).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("keeps tokens in httpOnly cookies and out of web storage", async ({
    page,
    context,
  }) => {
    await signInAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    const cookies = await context.cookies(`${BASE_URL}/api/auth`);
    expect(
      cookies.find((cookie) => cookie.name === "access_token")?.httpOnly,
    ).toBe(true);
    expect(
      cookies.find((cookie) => cookie.name === "refresh_token")?.httpOnly,
    ).toBe(true);

    const storedItems = await page.evaluate(
      () => window.localStorage.length + window.sessionStorage.length,
    );
    expect(storedItems).toBe(0);
  });

  test("silently renews an expired access token using the refresh token", async ({
    page,
    context,
  }) => {
    await signInAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    await context.addCookies([
      { name: "access_token", value: "expired-token", url: BASE_URL },
    ]);
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    const cookies = await context.cookies(BASE_URL);
    expect(
      cookies.find((cookie) => cookie.name === "access_token")?.value,
    ).not.toBe("expired-token");
  });
});
