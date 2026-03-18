/**
 * rateLimitHelper — Shared in-memory rate limiter for Deno backend functions.
 * Keyed by (userId + action). Window-based sliding counter.
 * NOTE: In-memory per isolate — resets on cold start. Acceptable for edge-side protection.
 */

const store = new Map();

/**
 * Check and record a rate-limited action.
 * @param {string} key       - Unique key (e.g. "user@mail.com:checkout")
 * @param {number} maxCalls  - Max allowed calls in the window
 * @param {number} windowMs  - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, maxCalls, windowMs) {
  const now = Date.now();
  const entry = store.get(key) || { calls: [], blockedUntil: 0 };

  // If currently blocked
  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.blockedUntil - now
    };
  }

  // Evict old calls outside the window
  entry.calls = entry.calls.filter(t => now - t < windowMs);

  if (entry.calls.length >= maxCalls) {
    entry.blockedUntil = now + windowMs;
    store.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs
    };
  }

  entry.calls.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: maxCalls - entry.calls.length,
    retryAfterMs: 0
  };
}

/**
 * Convenience: build standard 429 response
 */
export function rateLimitResponse(retryAfterMs = 60000) {
  const seconds = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: `Trop de requêtes — réessayez dans ${seconds} seconde(s)` }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(seconds)
      }
    }
  );
}