import type { SafeFetchResult } from "../security/safeFetch.js";
import type { RawFinding } from "./types.js";

export interface PerformanceMetrics {
  responseTimeMs: number;
  documentSizeBytes: number;
  scriptCount: number;
  stylesheetCount: number;
  imageCount: number;
  compressed: boolean;
  cacheControlPresent: boolean;
}

export function computePerformanceMetrics(res: SafeFetchResult): PerformanceMetrics {
  const html = res.bodyText;
  return {
    responseTimeMs: res.timingMs,
    documentSizeBytes: Buffer.byteLength(html, "utf-8"),
    scriptCount: (html.match(/<script\b/gi) ?? []).length,
    stylesheetCount: (html.match(/<link[^>]+rel=["']stylesheet["']/gi) ?? []).length,
    imageCount: (html.match(/<img\b/gi) ?? []).length,
    compressed: Boolean(res.headers.get("content-encoding")),
    cacheControlPresent: Boolean(res.headers.get("cache-control")),
  };
}

export function runPerformanceChecks(res: SafeFetchResult): RawFinding[] {
  const findings: RawFinding[] = [];
  const metrics = computePerformanceMetrics(res);
  const html = res.bodyText;

  if (metrics.responseTimeMs > 1500) {
    findings.push({
      ruleId: "performance/slow-response-time",
      title: "Slow initial response time",
      severity: metrics.responseTimeMs > 3000 ? "high" : "medium",
      confidence: "high",
      evidence: { responseTimeMs: String(metrics.responseTimeMs) },
    });
  }

  if (metrics.documentSizeBytes > 300_000) {
    findings.push({
      ruleId: "performance/large-document-size",
      title: "Large HTML document size",
      severity: "medium",
      confidence: "high",
      evidence: { bytes: String(metrics.documentSizeBytes) },
    });
  }

  if (!metrics.compressed) {
    findings.push({
      ruleId: "performance/no-compression",
      title: "Response not served with compression",
      severity: "medium",
      confidence: "high",
      evidence: { contentEncoding: "Not detected" },
    });
  }

  if (!metrics.cacheControlPresent) {
    findings.push({
      ruleId: "performance/no-cache-control",
      title: "No Cache-Control header present",
      severity: "low",
      confidence: "high",
      evidence: { cacheControl: "Not detected" },
    });
  }

  // Render-blocking heuristic: <script> tags in <head> without async/defer/type=module
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : "";
  const blockingScripts = Array.from(
    headContent.matchAll(/<script\b([^>]*)src=["'][^"']+["']([^>]*)>/gi)
  ).filter(([, pre, post]) => !/(async|defer)/i.test(pre + post));
  if (blockingScripts.length > 0) {
    findings.push({
      ruleId: "performance/render-blocking-scripts",
      title: "Render-blocking scripts in <head>",
      severity: "medium",
      confidence: "medium",
      evidence: { count: String(blockingScripts.length) },
    });
  }

  // Images without lazy-loading
  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  const withoutLazy = imgTags.filter((tag) => !/loading=["']lazy["']/i.test(tag));
  if (imgTags.length > 4 && withoutLazy.length > 0) {
    findings.push({
      ruleId: "performance/missing-lazy-loading",
      title: "Images not using native lazy-loading",
      severity: "low",
      confidence: "medium",
      evidence: { count: String(withoutLazy.length), total: String(imgTags.length) },
    });
  }

  if (metrics.scriptCount > 20) {
    findings.push({
      ruleId: "performance/many-script-tags",
      title: "High number of <script> tags",
      severity: "low",
      confidence: "medium",
      evidence: { count: String(metrics.scriptCount) },
    });
  }

  return findings;
}
