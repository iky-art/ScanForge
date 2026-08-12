import type { SafeFetchResult } from "../security/safeFetch.js";
import type { RawFinding } from "./types.js";

export function runSeoChecks(res: SafeFetchResult): RawFinding[] {
  const findings: RawFinding[] = [];
  const html = res.bodyText;

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  if (title && (title.length < 15 || title.length > 60)) {
    findings.push({
      ruleId: "seo/title-length",
      title: "Title length outside recommended range",
      severity: "low",
      confidence: "medium",
      evidence: { length: String(title.length), value: title.slice(0, 80) },
    });
  }

  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const description = descMatch ? descMatch[1].trim() : "";
  if (description && (description.length < 50 || description.length > 160)) {
    findings.push({
      ruleId: "seo/meta-description-length",
      title: "Meta description length outside recommended range",
      severity: "low",
      confidence: "medium",
      evidence: { length: String(description.length) },
    });
  }

  const robotsMeta = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  if (robotsMeta && /noindex/i.test(robotsMeta[1])) {
    findings.push({
      ruleId: "seo/noindex-detected",
      title: "Page is marked noindex",
      severity: "high",
      confidence: "high",
      evidence: { content: robotsMeta[1] },
    });
  }

  const hasStructuredData = /application\/ld\+json/i.test(html);
  if (!hasStructuredData) {
    findings.push({
      ruleId: "seo/missing-structured-data",
      title: "No structured data (JSON-LD) detected",
      severity: "low",
      confidence: "medium",
      evidence: { status: "Not detected" },
    });
  }

  const internalLinks = (html.match(/<a\b[^>]+href=["']\/[^"']*["']/gi) ?? []).length;
  const externalLinks = (html.match(/<a\b[^>]+href=["']https?:\/\/[^"']*["']/gi) ?? []).length;
  if (internalLinks === 0) {
    findings.push({
      ruleId: "seo/no-internal-links",
      title: "No internal links detected on page",
      severity: "medium",
      confidence: "medium",
      evidence: { internalLinks: "0", externalLinks: String(externalLinks) },
    });
  }

  return findings;
}
