// Lightweight in-memory, per-key rolling-window rate limiter.
//
// Good enough for a single-node MVP. Limitation: state is per-process, so on a
// serverless / multi-instance deploy (e.g. Vercel) each instance keeps its own
// counters and the effective limit is multiplied by the instance count. For a
// production launch, back this with Upstash Redis (or similar) so limits are
// shared across instances.

const buckets = new Map<string, number[]>();

interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const since = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > since);

  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterMs = Math.max(1000, oldest + windowMs - now);
    buckets.set(key, hits);
    return { ok: false, retryAfterMs, remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterMs: 0, remaining: Math.max(0, limit - hits.length) };
}

// Test helper / housekeeping — exposed so tests or a cron can clear state.
export function resetRateLimits(): void {
  buckets.clear();
}
