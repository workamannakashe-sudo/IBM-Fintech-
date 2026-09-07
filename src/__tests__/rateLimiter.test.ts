import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, recordAttempt, resetRateLimit } from "../utils/rateLimiter";

describe("rateLimiter Utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("allows actions within the threshold", () => {
    const key = "test_action";
    const limit = checkRateLimit(key, 3, 5000, 5000);
    expect(limit.allowed).toBe(true);
    expect(limit.remainingAttempts).toBe(3);
  });

  it("blocks actions after max attempts are exceeded", () => {
    const key = "test_login";
    recordAttempt(key, 3, 5000, 5000);
    recordAttempt(key, 3, 5000, 5000);
    const lastAttempt = recordAttempt(key, 3, 5000, 5000);

    expect(lastAttempt.allowed).toBe(false);
    expect(lastAttempt.remainingAttempts).toBe(0);
    expect(lastAttempt.retryAfterSeconds).toBeGreaterThan(0);

    const checked = checkRateLimit(key, 3, 5000, 5000);
    expect(checked.allowed).toBe(false);
  });

  it("resets limit properly on success", () => {
    const key = "test_reset";
    recordAttempt(key, 2, 5000, 5000);
    resetRateLimit(key);

    const check = checkRateLimit(key, 2, 5000, 5000);
    expect(check.allowed).toBe(true);
    expect(check.remainingAttempts).toBe(2);
  });
});
