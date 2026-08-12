import type { SafeFetchResult } from "../security/safeFetch.js";
import type { RawFinding } from "./types.js";

export function runAccessibilityChecks(res: SafeFetchResult): RawFinding[] {
  const findings: RawFinding[] = [];
  const html = res.bodyText;

  // Empty links (no visible text and no aria-label)
  const anchors = Array.from(html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi));
  let emptyLinks = 0;
  for (const [, attrs, inner] of anchors) {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
    if (!text && !hasAriaLabel) emptyLinks++;
  }
  if (emptyLinks > 0) {
    findings.push({
      ruleId: "accessibility/empty-links",
      title: "Links with no accessible text found",
      severity: "medium",
      confidence: "high",
      evidence: { count: String(emptyLinks) },
    });
  }

  // Form inputs missing labels (heuristic: no matching <label for=id>, no aria-label, no aria-labelledby)
  const labelFors = new Set(
    Array.from(html.matchAll(/<label[^>]+for=["']([^"']+)["']/gi)).map((m) => m[1])
  );
  const inputs = Array.from(
    html.matchAll(/<input\b([^>]*)>/gi)
  ).filter(([, attrs]) => !/type=["'](hidden|submit|button)["']/i.test(attrs));

  let unlabeled = 0;
  for (const [, attrs] of inputs) {
    const idMatch = attrs.match(/\sid=["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : null;
    const hasAria = /aria-label(ledby)?=["'][^"']+["']/i.test(attrs);
    const hasMatchingLabel = id ? labelFors.has(id) : false;
    if (!hasAria && !hasMatchingLabel) unlabeled++;
  }
  if (unlabeled > 0) {
    findings.push({
      ruleId: "accessibility/missing-form-labels",
      title: "Form inputs missing associated labels",
      severity: "high",
      confidence: "medium",
      evidence: { count: String(unlabeled) },
    });
  }

  // Heading hierarchy — flag if a heading level is skipped (e.g. h2 -> h4)
  const headingLevels = Array.from(html.matchAll(/<h([1-6])[\s>]/gi)).map((m) =>
    Number(m[1])
  );
  let skipped = false;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) skipped = true;
  }
  if (skipped) {
    findings.push({
      ruleId: "accessibility/heading-hierarchy-skip",
      title: "Heading levels skip a level",
      severity: "low",
      confidence: "medium",
      evidence: { sequence: headingLevels.join(" > ") },
    });
  }

  // Buttons with no accessible name
  const buttons = Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi));
  let unnamedButtons = 0;
  for (const [, attrs, inner] of buttons) {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const hasAria = /aria-label=["'][^"']+["']/i.test(attrs);
    if (!text && !hasAria) unnamedButtons++;
  }
  if (unnamedButtons > 0) {
    findings.push({
      ruleId: "accessibility/unnamed-buttons",
      title: "Buttons with no accessible name",
      severity: "high",
      confidence: "medium",
      evidence: { count: String(unnamedButtons) },
    });
  }

  // document language (also relevant to a11y)
  if (!/<html[^>]+lang=["'][^"']+["']/i.test(html)) {
    findings.push({
      ruleId: "accessibility/missing-doc-language",
      title: "Document language not declared",
      severity: "medium",
      confidence: "high",
      evidence: { status: "Not detected" },
    });
  }

  // iframe title
  const iframes = Array.from(html.matchAll(/<iframe\b([^>]*)>/gi));
  const iframesWithoutTitle = iframes.filter(([, attrs]) => !/title=["'][^"']+["']/i.test(attrs));
  if (iframesWithoutTitle.length > 0) {
    findings.push({
      ruleId: "accessibility/iframe-missing-title",
      title: "iframe elements missing a title attribute",
      severity: "medium",
      confidence: "high",
      evidence: { count: String(iframesWithoutTitle.length) },
    });
  }

  return findings;
}
