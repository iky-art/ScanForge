import type { Request, Response, NextFunction } from "express";

// Simple in-memory fixed-window limiter. Good enough for a single-instance
// v1 deployment; swap for a shared store (Redis) if you scale horizontally.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const hits = new Map<string, { count: number; windowStart: number }>();

export function scanRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "Too many scan requests. Please wait a minute and try again.",
    });
  }

  entry.count++;
  next();
}
