import type { Context, Next } from "hono";

// Simple in-memory rate limiter (use Redis in production)
const requests = new Map<string, { count: number; resetAt: number }>();

// Purge expired entries every 5 minutes to prevent unbounded Map growth.
const _cleanup = setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of requests) {
      if (now > record.resetAt) requests.delete(key);
    }
  },
  5 * 60 * 1000,
);
if (typeof _cleanup.unref === "function") _cleanup.unref();

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const ip =
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";

    const now = Date.now();
    const key = `${ip}:${c.req.path}`;
    const record = requests.get(key);

    if (!record || now > record.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return c.json(
          {
            error: "Too many requests",
            retryAfter: Math.ceil((record.resetAt - now) / 1000),
          },
          429,
        );
      }
    }

    return next();
  };
}
