// e2e/auth.spec.ts — E2E tests for BudgetMitra authentication flows
import { test, expect } from "@playwright/test";

// Use a unique email per run to avoid localStorage collision between test runs
const testEmail = `e2e_${Date.now()}@budgetmitra.test`;
const testPassword = "TestPass123!";
const testName = "E2E Tester";

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the login page when unauthenticated", async ({ page }) => {
    // The Login page should be visible with at least one auth tab
    await expect(page.getByRole("tab", { name: /login/i }).or(
      page.getByText(/sign in/i).first()
    )).toBeVisible({ timeout: 10_000 });
  });

  test("can register a new user and land on dashboard", async ({ page }) => {
    // Navigate to Register tab
    const registerTab = page.getByRole("tab", { name: /register|sign up/i }).or(
      page.getByText(/register|create account/i).first()
    );
    await registerTab.click();

    // Fill registration form
    const nameField = page.getByPlaceholder(/name/i).or(page.getByLabel(/name/i)).first();
    await nameField.fill(testName);

    const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();
    await emailField.fill(testEmail);

    const passwordField = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).first();
    await passwordField.fill(testPassword);

    // Submit — look for Register or Create Account button
    const submitBtn = page.getByRole("button", { name: /register|create account|sign up/i }).first();
    await submitBtn.click();

    // Should land on dashboard — look for a known dashboard element
    await expect(
      page.getByText(/good morning|good afternoon|good evening/i)
        .or(page.getByText(/dashboard/i).first())
    ).toBeVisible({ timeout: 15_000 });
  });

  test("can login with demo credentials", async ({ page }) => {
    const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();
    await emailField.fill("rahul@budgetmitra.in");

    const passwordField = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).first();
    await passwordField.fill("demo1234");

    const loginBtn = page.getByRole("button", { name: /login|sign in/i }).first();
    await loginBtn.click();

    // Should land on dashboard and show the demo user name
    await expect(
      page.getByText(/rahul|sharma|good morning|good afternoon|good evening/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("shows error for wrong password", async ({ page }) => {
    const emailField = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).first();
    await emailField.fill("rahul@budgetmitra.in");

    const passwordField = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i)).first();
    await passwordField.fill("wrongpassword");

    const loginBtn = page.getByRole("button", { name: /login|sign in/i }).first();
    await loginBtn.click();

    // Error message should appear
    await expect(
      page.getByText(/incorrect|invalid|wrong|error/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("can log in as guest and reach dashboard", async ({ page }) => {
    const guestBtn = page.getByRole("button", { name: /guest|try demo|explore/i }).first();
    await guestBtn.click();

    // Dashboard should appear
    await expect(
      page.getByText(/good morning|good afternoon|good evening|dashboard/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
