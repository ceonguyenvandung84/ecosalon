const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: { intervalMs: number; maxRequests: number }) {
  const { intervalMs, maxRequests } = options;
  return (key: string): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + intervalMs });
      return { allowed: true, remaining: maxRequests - 1, resetAt: now + intervalMs };
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
  };
}

export const apiLimiter = rateLimit({
  intervalMs: parseInt(process.env.RATE_LIMIT_API_INTERVAL_MS ?? "60000", 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_API_MAX ?? "60", 10),
});
export const authLimiter = rateLimit({
  intervalMs: parseInt(process.env.RATE_LIMIT_AUTH_INTERVAL_MS ?? "60000", 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? "10", 10),
});