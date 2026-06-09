/**
 * In-memory rate limiter middleware — no external dependencies.
 * Production: swap the store for Redis.
 */
import type { Request, Response, NextFunction } from "express";

interface RateRecord { count: number; resetAt: number }
const stores = new Map<string, Map<string, RateRecord>>();

function makeStore(id: string) {
  if (!stores.has(id)) stores.set(id, new Map());
  return stores.get(id)!;
}

// Export for testing/resetting
export function resetRateLimiterForTesting() {
  stores.clear();
}

function createLimiter(opts: { windowMs: number; max: number; message?: string }) {
  const store = makeStore(`${opts.windowMs}-${opts.max}`);
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    let rec = store.get(key);
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, rec);
    }
    rec.count++;
    if (rec.count > opts.max) {
      const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      res.status(429).json({ error: opts.message ?? "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const store of Array.from(stores.values())) {
    for (const [key, rec] of Array.from(store.entries())) {
      if (rec.resetAt <= now) store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const loginLimiter     = createLimiter({ windowMs: 15 * 60 * 1000, max: 10,  message: "Too many login attempts. Try again in 15 minutes." });
export const signupLimiter    = createLimiter({ windowMs: 60 * 60 * 1000, max: 5,   message: "Too many signup attempts. Try again in an hour." });
export const messagingLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 100, message: "Message rate limit exceeded." });
export const uploadLimiter    = createLimiter({ windowMs: 15 * 60 * 1000, max: 20,  message: "Upload limit reached. Try again later." });
// Increased from 300 to 1000 to accommodate polling queries (notifications, etc.)
export const generalApiLimiter= createLimiter({ windowMs: 15 * 60 * 1000, max: 1000, message: "API rate limit exceeded." });
// Separate limiter for notifications polling - very permissive since it's low-cost queries
export const notificationsLimiter = createLimiter({ windowMs: 1 * 60 * 1000, max: 200, message: "Notification polling rate limit exceeded." });
