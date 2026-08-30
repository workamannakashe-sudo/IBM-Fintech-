// passwordHashing.test.ts — Unit tests for SHA-256 password hashing utilities
// Tests hashPassword() and isPlaintextPassword() in src/utils/security.ts
import { describe, it, expect } from "vitest";
import { hashPassword, isPlaintextPassword } from "../utils/security";

// ── hashPassword ───────────────────────────────────────────────────────────

describe("hashPassword", () => {
  it("produces a 64-character lowercase hex digest", async () => {
    const hash = await hashPassword("mySecurePassword");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic: same input always yields the same hash", async () => {
    const h1 = await hashPassword("hello123");
    const h2 = await hashPassword("hello123");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", async () => {
    const h1 = await hashPassword("password1");
    const h2 = await hashPassword("password2");
    expect(h1).not.toBe(h2);
  });

  it("trims surrounding whitespace before hashing", async () => {
    const h1 = await hashPassword("trimmed");
    const h2 = await hashPassword("  trimmed  ");
    expect(h1).toBe(h2);
  });

  it("handles empty string input without throwing", async () => {
    const hash = await hashPassword("");
    expect(hash).toHaveLength(64);
  });

  it("matches the known SHA-256 digest of 'demo1234'", async () => {
    // This validates that the hard-coded DEMO_PASSWORD_HASH constant is correct
    const EXPECTED = "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";
    const hash = await hashPassword("demo1234");
    expect(hash).toBe(EXPECTED);
  });
});

// ── isPlaintextPassword ────────────────────────────────────────────────────

describe("isPlaintextPassword", () => {
  it("returns true for a short plaintext password", () => {
    expect(isPlaintextPassword("hello123")).toBe(true);
  });

  it("returns true for a typical user password", () => {
    expect(isPlaintextPassword("demo1234")).toBe(true);
  });

  it("returns false for a valid 64-char hex SHA-256 digest", () => {
    const validHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
    expect(isPlaintextPassword(validHash)).toBe(false);
  });

  it("returns true for a 64-char string with uppercase letters (invalid hex)", () => {
    const upperHash = "A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3";
    expect(isPlaintextPassword(upperHash)).toBe(true);
  });

  it("returns true for a 63-char hex string (wrong length)", () => {
    const shortHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae"; // 63 chars
    expect(isPlaintextPassword(shortHash)).toBe(true);
  });

  it("returns false for an empty string", () => {
    expect(isPlaintextPassword("")).toBe(false);
  });
});
