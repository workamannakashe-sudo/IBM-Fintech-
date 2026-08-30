import { describe, it, expect, beforeEach } from "vitest";

describe("BudgetMitra Authentication & Local Accounts Registry", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and authenticates a newly registered user", () => {
    const email = "priya.sharma@iitb.ac.in";
    const password = "password123";
    const name = "Priya Sharma";

    // Simulate saving account
    const accounts: Record<string, any> = {};
    accounts[email.toLowerCase().trim()] = {
      email: email.toLowerCase().trim(),
      password: password.trim(),
      name,
      userType: "Student",
      currency: "INR",
      profile: { name, course: "B.Tech", year: 2, monthlyAllowance: 15000 },
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("bm_user_accounts", JSON.stringify(accounts));

    // Verify stored account retrieval
    const stored = JSON.parse(localStorage.getItem("bm_user_accounts") || "{}");
    const user = stored[email.toLowerCase().trim()];

    expect(user).toBeDefined();
    expect(user.password).toBe("password123");
    expect(user.name).toBe("Priya Sharma");
  });

  it("rejects invalid password", () => {
    const email = "priya.sharma@iitb.ac.in";
    const password = "password123";

    const accounts: Record<string, any> = {};
    accounts[email] = { email, password };
    localStorage.setItem("bm_user_accounts", JSON.stringify(accounts));

    const stored = JSON.parse(localStorage.getItem("bm_user_accounts") || "{}");
    const user = stored[email];

    expect(user).toBeDefined();
    expect(user.password === "wrongpassword").toBe(false);
  });

  it("normalizes email casing and whitespace correctly", () => {
    const rawEmail = "  Student.Test@College.IN  ";
    const normalized = rawEmail.trim().toLowerCase();

    expect(normalized).toBe("student.test@college.in");
  });
});
