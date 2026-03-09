/**
 * @fileoverview Lightweight in-memory rate limiter for Next.js API routes.
 *
 * Uses a sliding-window counter per IP. No external dependencies.
 * Suitable for low-to-medium traffic; for high-scale use Upstash Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
 *   const result = limiter.check(ip);
 *   if (!result.ok) return NextResponse.json(..., { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Prune expired entries every 5 minutes to prevent unbounded memory growth
  const pruneInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60_000);

  // Allow GC in serverless environments
  if (typeof pruneInterval.unref === 'function') {
    pruneInterval.unref();
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);

    return {
      ok: entry.count <= limit,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  return { check };
}
