// security.ts - Enterprise Security & Data Privacy Utilities for BudgetMitra
/**
 * Sanitizes untrusted user strings to prevent XSS injection attacks.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Validates and sanitizes monetary amounts with boundary constraints.
 */
export function sanitizeCurrencyAmount(amount: number | string, maxLimit = 100_000_000): number {
  const parsed = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.min(parsed, maxLimit);
}

/**
 * Strips dangerous prompt injection sequences before passing user queries to AI models.
 */
export function sanitizePromptQuery(query: string): string {
  if (!query) return "";
  const cleaned = query
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "[filtered]")
    .replace(/system\s+prompt/gi, "[filtered]")
    .replace(/system\s+role/gi, "[filtered]")
    .replace(/system:/gi, "")
    .trim();
  return cleaned.slice(0, 1000); // 1000 character defense-in-depth ceiling
}

/**
 * Safely parses and validates JSON payloads from local storage with fallback protection.
 */
export function safeStorageGet<T>(key: string, fallback: T, validator?: (val: unknown) => val is T): T {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) {
      console.warn(`[Security] LocalStorage schema mismatch for key: ${key}, using fallback.`);
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[Security] Failed to parse LocalStorage key: ${key}`, err);
    return fallback;
  }
}

/**
 * Safely saves data to local storage with error handling for quota limits.
 */
export function safeStorageSet(key: string, value: unknown): boolean {
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return false;
    }
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.error(`[Security] LocalStorage quota exceeded or storage unavailable for key: ${key}`, err);
    return false;
  }
}

/**
 * Masks sensitive API keys and tokens for safe UI display and log redaction.
 */
export function maskSecretKey(secret: string): string {
  if (!secret) return "Not Configured";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}
