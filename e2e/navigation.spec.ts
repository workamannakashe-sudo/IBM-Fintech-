// e2e/navigation.spec.ts — E2E tests for sidebar navigation across all pages
import { test, expect, Page } from "@playwright/test";

/** Helper: log in as demo user and wait for dashboard */
async function loginAsDemo(page: Page) {
  await page.goto("/");
  const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();
  await emailField.fill("rahul@budgetmitra.in");
  const passwordField = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).first();
  await passwordField.fill("demo1234");
  await page.getByRole("button", { name: /login|sign in/i }).first().click();
  await expect(
    page.getByText(/good morning|good afternoon|good evening/i).first()
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  const navItems: Array<{ label: RegExp; pageText: RegExp }> = [
    { label: /expenses|transactions/i,    pageText: /expenses|transactions|spending/i },
    { label: /budget|envelopes/i,         pageText: /budget|envelope/i },
    { label: /loans|emi/i,                pageText: /loan|emi|repay/i },
    { label: /scholarships|schemes/i,     pageText: /scholarship|scheme/i },
    { label: /split bill/i,               pageText: /split|roommate|friends/i },
    { label: /habits|insights/i,          pageText: /habit|streak|insights/i },
    { label: /advisor|coach/i,            pageText: /advisor|coach|ai/i },
    { label: /affordability|can i afford/i, pageText: /afford|purchase|buy/i },
  ];

  for (const { label, pageText } of navItems) {
    test(`navigates to page matching "${label.source}"`, async ({ page }) => {
      // Find and click sidebar nav item
      const navLink = page.getByRole("link", { name: label })
        .or(page.getByRole("button", { name: label }))
        .first();

      await navLink.click();

      // Page content should change to show expected text
      await expect(page.getByText(pageText).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("can return to Dashboard from any page", async ({ page }) => {
    // Navigate away first
    const expensesLink = page.getByRole("link", { name: /expenses/i })
      .or(page.getByRole("button", { name: /expenses/i })).first();
    await expensesLink.click();

    // Then go back to Dashboard
    const dashLink = page.getByRole("link", { name: /dashboard|home/i })
      .or(page.getByRole("button", { name: /dashboard|home/i })).first();
    await dashLink.click();

    await expect(
      page.getByText(/good morning|good afternoon|good evening/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
