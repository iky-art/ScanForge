import type { SafeFetchResult } from "../security/safeFetch.js";
import { safeFetch, UnsafeTargetError } from "../security/safeFetch.js";
import type { RawFinding } from "./types.js";

function extractTag(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  return m ? m[1]?.trim() ?? null : null;
}

export async function runWebChecks(res: SafeFetchResult): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];
  const html = res.bodyText;

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  if (!title) {
    findings.push({
      ruleId: "web/missing-title",
      title: "Missing <title> element",
      severity: "high",
      confidence: "high",
      evidence: { status: "Not detected" },
    });
  }

  const metaDescription = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  if (!metaDescription) {
    findings.push({
      ruleId: "web/missing-meta-description",
      title: "Missing meta description",
      severity: "medium",
      confidence: "high",
      evidence: { status: "Not detected" },
    });
  }

  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  if (!canonical) {
    findings.push({
      ruleId: "web/missing-canonical",
      title: "Missing canonical link",
      severity: "low",
      confidence: "medium",
      evidence: { status: "Not detected" },
    });
  }

  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  if (!viewport) {
    findings.push({
      ruleId: "web/missing-viewport",
      title: "Missing viewport meta tag",
      severity: "high",
      confidence: "high",
      evidence: { status: "Not detected" },
    });
  }

  const favicon = /<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(html);
  if (!favicon) {
    findings.push({
      ruleId: "web/missing-favicon",
      title: "Missing favicon link",
      severity: "low",
      confidence: "medium",
      evidence: { status: "Not detected" },
    });
  }

  const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const hasOgDescription = /<meta[^>]+property=["']og:description["']/i.test(html);
  if (!hasOgTitle || !hasOgDescription) {
    findings.push({
      ruleId: "web/missing-open-graph",
      title: "Incomplete Open Graph metadata",
      severity: "low",
      confidence: "medium",
      evidence: {
        "og:title": hasOgTitle ? "present" : "missing",
        "og:description": hasOgDescription ? "present" : "missing",
      },
    });
  }

  const lang = extractTag(html, /<html[^>]+lang=["']([^"']+)["']/i);
  if (!lang) {
    findings.push({
      ruleId: "web/missing-lang-attribute",
      title: "Missing lang attribute on <html>",
      severity: "medium",
      confidence: "high",
      evidence: { status: "Not detected" },
    });
  }

  // Heading structure
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 0) {
    findings.push({
      ruleId: "web/missing-h1",
      title: "Page has no <h1> heading",
      severity: "medium",
      confidence: "high",
      evidence: { h1Count: "0" },
    });
  } else if (h1Count > 1) {
    findings.push({
      ruleId: "web/multiple-h1",
      title: "Page has multiple <h1> headings",
      severity: "low",
      confidence: "medium",
      evidence: { h1Count: String(h1Count) },
    });
  }

  // Duplicate IDs
  const ids = Array.from(html.matchAll(/\sid=["']([^"']+)["']/gi)).map((m) => m[1]);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    findings.push({
      ruleId: "web/duplicate-ids",
      title: "Duplicate element IDs found",
      severity: "medium",
      confidence: "high",
      evidence: { duplicates: Array.from(dupes).slice(0, 5).join(", ") },
    });
  }

  // Image alt coverage
  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  const missingAlt = imgTags.filter((tag) => !/\salt=["'][^"']*["']/i.test(tag));
  if (missingAlt.length > 0) {
    findings.push({
      ruleId: "web/missing-image-alt",
      title: "Images missing alt attribute",
      severity: "medium",
      confidence: "high",
      evidence: { count: String(missingAlt.length), total: String(imgTags.length) },
    });
  }

  // robots.txt / sitemap.xml presence — real fetches, best-effort
  const base = new URL(res.finalUrl);
  const robotsUrl = new URL("/robots.txt", base).toString();
  const sitemapUrl = new URL("/sitemap.xml", base).toString();

  try {
    const robots = await safeFetch(robotsUrl);
    if (!robots.ok) {
      findings.push({
        ruleId: "web/missing-robots-txt",
        title: "robots.txt not found",
        severity: "low",
        confidence: "high",
        evidence: { status: String(robots.status) },
      });
    }
  } catch (err) {
    if (!(err instanceof UnsafeTargetError)) {
      findings.push({
        ruleId: "web/missing-robots-txt",
        title: "robots.txt could not be checked",
        severity: "low",
        confidence: "low",
        evidence: { status: "Not available" },
        anomalous: true,
      });
    }
  }

  try {
    const sitemap = await safeFetch(sitemapUrl);
    if (!sitemap.ok) {
      findings.push({
        ruleId: "web/missing-sitemap",
        title: "sitemap.xml not found",
        severity: "low",
        confidence: "medium",
        evidence: { status: String(sitemap.status) },
      });
    }
  } catch (err) {
    if (!(err instanceof UnsafeTargetError)) {
      findings.push({
        ruleId: "web/missing-sitemap",
        title: "sitemap.xml could not be checked",
        severity: "low",
        confidence: "low",
        evidence: { status: "Not available" },
        anomalous: true,
      });
    }
  }

  // Inline scripts/styles — informational
  const inlineScripts = (html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) ?? []).length;
  if (inlineScripts > 0) {
    findings.push({
      ruleId: "web/inline-script",
      title: "Inline <script> blocks present",
      severity: "low",
      confidence: "high",
      evidence: { count: String(inlineScripts) },
    });
  }

  return findings;
}
