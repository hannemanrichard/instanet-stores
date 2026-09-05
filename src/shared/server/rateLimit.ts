import { NextRequest } from "next/server";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const getOrCreateBucket = (
  key: string,
  windowMs: number,
  now: number
): Bucket => {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return fresh;
  }

  return existing;
};

export const consumeRateLimit = (
  options: RateLimitOptions
): RateLimitResult => {
  const now = options.now ?? Date.now();
  const bucket = getOrCreateBucket(options.key, options.windowMs, now);

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      ),
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    resetAt: bucket.resetAt,
  };
};

export const getRequestIp = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
};

export const rateLimitByIp = (
  req: NextRequest,
  name: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  return consumeRateLimit({
    key: `${name}:ip:${getRequestIp(req)}`,
    limit,
    windowMs,
  });
};

export const rateLimitByActor = (
  actorKey: string,
  name: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  return consumeRateLimit({
    key: `${name}:actor:${actorKey}`,
    limit,
    windowMs,
  });
};

export const resetRateLimitStore = () => {
  buckets.clear();
};
