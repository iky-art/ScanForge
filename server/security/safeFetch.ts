import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF-hardened fetch wrapper for the scanner.
 *
 * Rules:
 * - Only http/https protocols.
 * - Resolve hostname first; reject if it resolves to a private, loopback,
 *   link-local, or otherwise internal address.
 * - Every redirect hop is re-validated against the same rules (prevents
 *   DNS-rebinding-style bypasses via a redirect to an internal target).
 * - Hard timeout via AbortController.
 * - Hard cap on response body size, enforced while streaming (not just
 *   trusting Content-Length, since that header can lie).
 */

const TIMEOUT_MS = Number(process.env.SCAN_REQUEST_TIMEOUT_MS ?? 10000);
const MAX_REDIRECTS = Number(process.env.SCAN_MAX_REDIRECTS ?? 5);
const MAX_BYTES = Number(process.env.SCAN_MAX_RESPONSE_BYTES ?? 5_000_000);

export class UnsafeTargetError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 0) return true; // "this" network
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — validate the embedded IPv4 too
    return isPrivateIPv4(lower.replace("::ffff:", ""));
  }
  return false;
}

function isDisallowedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unknown format — fail closed
}

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal", // cloud metadata endpoints
]);

async function assertHostIsSafe(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase();
  if (DISALLOWED_HOSTNAMES.has(lower)) {
    throw new UnsafeTargetError(`Target host "${hostname}" is not allowed.`);
  }
  if (lower.endsWith(".local") || lower.endsWith(".internal")) {
    throw new UnsafeTargetError(`Target host "${hostname}" is not allowed.`);
  }

  let records: string[];
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);
    records = [
      ...(v4.status === "fulfilled" ? v4.value : []),
      ...(v6.status === "fulfilled" ? v6.value : []),
    ];
  } catch {
    throw new UnsafeTargetError(`Could not resolve host "${hostname}".`);
  }

  if (records.length === 0) {
    throw new UnsafeTargetError(`Host "${hostname}" did not resolve to any address.`);
  }

  for (const ip of records) {
    if (isDisallowedIp(ip)) {
      throw new UnsafeTargetError(
        `Target host "${hostname}" resolves to a private/internal address and cannot be scanned.`
      );
    }
  }
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  headers: Headers;
  finalUrl: string;
  bodyText: string;
  bodyTruncated: boolean;
  timingMs: number;
}

export async function assertUrlIsScannable(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeTargetError("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeTargetError("Only http:// and https:// URLs can be scanned.");
  }
  await assertHostIsSafe(url.hostname);
  return url;
}

export async function safeFetch(
  rawUrl: string,
  opts: { method?: string; redirectsLeft?: number } = {}
): Promise<SafeFetchResult> {
  const method = opts.method ?? "GET";
  const redirectsLeft = opts.redirectsLeft ?? MAX_REDIRECTS;

  const url = await assertUrlIsScannable(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "ScanForge/1.0 (+authorized-scan)",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  // Manually follow redirects so every hop is re-validated.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      throw new UnsafeTargetError("Redirect response missing Location header.");
    }
    if (redirectsLeft <= 0) {
      throw new UnsafeTargetError("Too many redirects.");
    }
    const nextUrl = new URL(location, url);
    return safeFetch(nextUrl.toString(), { method, redirectsLeft: redirectsLeft - 1 });
  }

  const reader = response.body?.getReader();
  let received = 0;
  let truncated = false;
  const chunks: Uint8Array[] = [];

  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_BYTES) {
          truncated = true;
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
  }

  const bodyText = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    finalUrl: url.toString(),
    bodyText,
    bodyTruncated: truncated,
    timingMs: Date.now() - started,
  };
}
