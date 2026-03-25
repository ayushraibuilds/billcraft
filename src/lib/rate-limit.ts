import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for serverless
// Resets on cold start, but good enough for free-tier abuse prevention
const requestLog = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  prefix?: string;
}

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10; // 10 per minute per IP

export function rateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): NextResponse | null {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const prefix = options?.prefix ?? "default";

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const entry = requestLog.get(key);

  if (!entry || now > entry.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + windowMs });
    return null; // allowed
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count++;

  // Inline cleanup: prune expired entries on every 20th request
  if (entry.count % 20 === 0) {
    for (const [k, v] of requestLog.entries()) {
      if (now > v.resetAt) requestLog.delete(k);
    }
  }

  return null; // allowed
}
