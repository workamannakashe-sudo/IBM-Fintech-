// e2e/dashboard.spec.ts — E2E tests for Dashboard interactions
import { test, expect, Page } from "@playwright/test";

/** Helper: log in as demo user */
async function loginAsDemo(page: Page) {
  await page.goto("/");
  const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();
  await emailField.fill("rahul@budgetmitra.in");
  const passwordField = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).first();
  await passwordField.fill("demo1234");
  await page.getByRole("button", { name: /login|sign in/i }).first().click();
  // Wait for dashboard to appear
  await expect(
    page.getByText(/good morning|good afternoon|good evening/i).first()
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Dashboard", () => {
  test("shows greeting with user name after login", async ({ page }) => {
    await loginAsDemo(page);
    // Greeting should contain the demo user's name
    await expect(page.getByText(/rahul/i).first()).toBeVisible();
  });

  test("dashboard displays key financial metric cards", async ({ page }) => {
    await loginAsDemo(page);
    // Payments breakdown card
    await expect(page.getByText(/payments breakdown/i).first()).toBeVisible();
    // Gross Volume / Envelopes card
    await expect(page.getByText(/gross volume/i).first()).toBeVisible();
  });

  test("FAB opens Quick Log modal", async ({ page }) => {
    await loginAsDemo(page);
    // Click the floating action button
    const fab = page.getByRole("button", { name: /quick log|add expense|log/i })
      .or(page.locator("button").filter({ hasText: /\+/ }).last());
    await fab.click();
    // Modal or form should appear
    await expect(
      page.getByText(/log expense|quick log|add transaction/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("can log a transaction via Quick Log modal", async ({ page }) => {
    await loginAsDemo(page);

    // Open FAB / Quick Log
    const fab = page.getByRole("button", { name: /quick log|add expense|\+/i }).last();
    await fab.click();

    // Fill description
    const descField = page.getByPlaceholder(/description|what did you spend/i)
      .or(page.getByLabel(/description/i)).first();
    await descField.fill("E2E Coffee Test");

    // Fill amount
    const amtField = page.getByPlaceholder(/amount|₹|rs/i)
      .or(page.getByLabel(/amount/i)).first();
    await amtField.fill("120");

    // Submit
    const addBtn = page.getByRole("button", { name: /add|save|log|submit/i }).last();
    await addBtn.click();

    // Transaction should appear somewhere in the UI (dashboard or expenses)
    await expect(page.getByText(/coffee/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("PDF report download button is visible", async ({ page }) => {
    await loginAsDemo(page);
    // Reports pill or Download button
    await expect(
      page.getByText(/reports|download|pdf/i).first()
    ).toBeVisible();
  });
});
