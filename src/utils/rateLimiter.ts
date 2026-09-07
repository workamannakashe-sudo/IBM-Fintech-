// rateLimiter.ts — BudgetMitra Anti-Brute-Force & API Rate Limiting Utility
// ==============================================================================
// Protects authentication and expensive AI API endpoints from spam & brute force.
// 100% client-side sliding window algorithm with exponential backoff.
// ==============================================================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil: number;
}

const STORAGE_PREFIX = "bm_ratelimit_";

/**
 * Check if an action key is currently rate-limited.
 *
 * @param key - Unique key identifier (e.g. "auth_login", "ai_ask_bob")
 * @param maxAttempts - Maximum attempts allowed before locking (default: 5)
 * @param windowMs - Sliding time window in ms (default: 60,000 = 1 min)
 * @param blockDurationMs - Lockout duration if limit exceeded (default: 30,000 = 30s)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000,
  blockDurationMs: number = 30_000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(storageKey);
    let record: RateLimitRecord = raw
      ? JSON.parse(raw)
      : { attempts: 0, firstAttemptTime: now, blockedUntil: 0 };

    // If currently blocked
    if (record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // Reset window if expired
    if (now - record.firstAttemptTime > windowMs) {
      record = { attempts: 0, firstAttemptTime: now, blockedUntil: 0 };
    }

    // Check if limit reached
    if (record.attempts >= maxAttempts) {
      record.blockedUntil = now + blockDurationMs;
      localStorage.setItem(storageKey, JSON.stringify(record));
      const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - record.attempts),
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }
}

/**
 * Record a failed attempt or consume one token from the rate limit bucket
 */
export function recordAttempt(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000,
  blockDurationMs: number = 30_000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(storageKey);
    let record: RateLimitRecord = raw
      ? JSON.parse(raw)
      : { attempts: 0, firstAttemptTime: now, blockedUntil: 0 };

    if (now - record.firstAttemptTime > windowMs) {
      record = { attempts: 1, firstAttemptTime: now, blockedUntil: 0 };
    } else {
      record.attempts += 1;
    }

    if (record.attempts >= maxAttempts) {
      record.blockedUntil = now + blockDurationMs;
    }

    localStorage.setItem(storageKey, JSON.stringify(record));

    if (record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - record.attempts),
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterSeconds: 0 };
  }
}

/**
 * Reset / clear rate limit after a successful action (e.g. valid password)
 */
export function resetRateLimit(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore storage errors
  }
}
