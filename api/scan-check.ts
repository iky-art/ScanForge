import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SafeFetchResult } from "../server/security/safeFetch.js";
import { runSecurityChecks } from "../server/scanner/securityChecks.js";
import { runWebChecks } from "../server/scanner/webChecks.js";
import { runSeoChecks } from "../server/scanner/seoChecks.js";
import { runAccessibilityChecks } from "../server/scanner/accessibilityChecks.js";
import { runPerformanceChecks, computePerformanceMetrics } from "../server/scanner/performanceChecks.js";
import type { RawFinding } from "../server/scanner/types.js";

type Category = "security" | "web" | "seo" | "accessibility" | "performance";

interface ConnectPayload {
  finalUrl: string;
  bodyText: string;
  bodyTruncated: boolean;
  timingMs: number;
  headers: Record<string, string>;
}

function toSafeFetchResult(payload: ConnectPayload): SafeFetchResult {
  return {
    ok: true,
    status: 200,
    finalUrl: payload.finalUrl,
    bodyText: payload.bodyText,
    bodyTruncated: payload.bodyTruncated,
    timingMs: payload.timingMs,
    // Reconstruct a real Headers instance so check functions can call .get()
    // exactly like they do when running against a live fetch response.
    headers: new Headers(payload.headers),
  };
}

let findingCounter = 1;

function enrich(raw: RawFinding[], category: string) {
  const prefix = category.slice(0, 3).toUpperCase();
  return raw.map((r) => ({
    id: `${prefix}-${String(findingCounter++).padStart(3, "0")}`,
    ruleId: r.ruleId,
    category,
    title: r.title,
    severity: r.severity,
    confidence: r.confidence,
    anomalous: r.anomalous ?? false,
    status: "open" as const,
    evidence: r.evidence,
    detectedAt: new Date().toISOString(),
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { category, target, connect } = req.body ?? {};
  if (!category || !connect) {
    res.status(400).json({ error: "Missing category or connect payload." });
    return;
  }

  findingCounter = 1; // per-invocation reset — each call is a fresh function instance anyway
  const fetchResult = toSafeFetchResult(connect);

  try {
    let raw: RawFinding[] = [];
    let metrics: ReturnType<typeof computePerformanceMetrics> | undefined;

    switch (category as Category) {
      case "security":
        raw = runSecurityChecks(fetchResult, String(target ?? ""));
        break;
      case "web":
        raw = await runWebChecks(fetchResult);
        break;
      case "seo":
        raw = runSeoChecks(fetchResult);
        break;
      case "accessibility":
        raw = runAccessibilityChecks(fetchResult);
        break;
      case "performance":
        raw = runPerformanceChecks(fetchResult);
        metrics = computePerformanceMetrics(fetchResult);
        break;
      default:
        res.status(400).json({ error: "Unknown category." });
        return;
    }

    res.status(200).json({
      category,
      findings: enrich(raw, category),
      metrics,
    });
  } catch {
    res.status(500).json({ error: `Check failed for category "${category}".` });
  }
}
