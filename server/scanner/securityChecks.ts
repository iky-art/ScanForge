import type { SafeFetchResult } from "../security/safeFetch.js";
import type { RawFinding } from "./types.js";

/**
 * Every check here reads only what actually came back from the target
 * (safeFetch result). No value is invented. If a header is absent, the
 * finding says "Not detected" — never a guess.
 */
export function runSecurityChecks(res: SafeFetchResult, requestedUrl: string): RawFinding[] {
  const findings: RawFinding[] = [];
  const h = res.headers;
  const isHttps = res.finalUrl.startsWith("https://");

  // HTTPS in use
  if (!isHttps) {
    findings.push({
      ruleId: "security/no-https",
      title: "Site is not served over HTTPS",
      severity: "critical",
      confidence: "high",
      evidence: { finalUrl: res.finalUrl },
    });
  }

  // HTTP -> HTTPS redirect (only meaningful if the original request was http)
  if (requestedUrl.startsWith("http://") && isHttps) {
    // Redirect chain in safeFetch already followed it — this is a pass,
    // recorded as a positive finding is optional; we only report problems.
  } else if (requestedUrl.startsWith("http://") && !isHttps) {
    findings.push({
      ruleId: "security/no-https-redirect",
      title: "HTTP does not redirect to HTTPS",
      severity: "high",
      confidence: "high",
      evidence: { requestedUrl, finalUrl: res.finalUrl },
    });
  }

  const headerChecks: {
    header: string;
    ruleId: string;
    title: string;
    severity: RawFinding["severity"];
  }[] = [
    { header: "strict-transport-security", ruleId: "security/missing-hsts", title: "Missing Strict-Transport-Security header", severity: "high" },
    { header: "content-security-policy", ruleId: "security/missing-csp", title: "Missing Content-Security-Policy header", severity: "high" },
    { header: "x-content-type-options", ruleId: "security/missing-xcto", title: "Missing X-Content-Type-Options header", severity: "low" },
    { header: "referrer-policy", ruleId: "security/missing-referrer-policy", title: "Missing Referrer-Policy header", severity: "low" },
    { header: "permissions-policy", ruleId: "security/missing-permissions-policy", title: "Missing Permissions-Policy header", severity: "low" },
    { header: "cross-origin-opener-policy", ruleId: "security/missing-coop", title: "Missing Cross-Origin-Opener-Policy header", severity: "low" },
    { header: "cross-origin-resource-policy", ruleId: "security/missing-corp", title: "Missing Cross-Origin-Resource-Policy header", severity: "low" },
  ];

  if (isHttps) {
    for (const check of headerChecks) {
      if (!h.get(check.header)) {
        findings.push({
          ruleId: check.ruleId,
          title: check.title,
          severity: check.severity,
          confidence: "high",
          evidence: { header: check.header, status: "Not detected" },
        });
      }
    }
  }

  // Server info exposure (informational — only flags what's visibly sent)
  const serverHeader = h.get("server");
  if (serverHeader && /\d/.test(serverHeader)) {
    findings.push({
      ruleId: "security/server-version-exposed",
      title: "Server header exposes version information",
      severity: "low",
      confidence: "medium",
      evidence: { header: "Server", value: serverHeader },
    });
  }

  const poweredBy = h.get("x-powered-by");
  if (poweredBy) {
    findings.push({
      ruleId: "security/x-powered-by-exposed",
      title: "X-Powered-By header exposes backend technology",
      severity: "low",
      confidence: "high",
      evidence: { header: "X-Powered-By", value: poweredBy },
    });
  }

  // Cookie flags — parsed from raw Set-Cookie header(s) actually returned.
  const setCookie = h.get("set-cookie");
  if (setCookie) {
    const cookies = setCookie.split(/,(?=[^;]+?=)/);
    for (const cookie of cookies) {
      const missing: string[] = [];
      if (isHttps && !/secure/i.test(cookie)) missing.push("Secure");
      if (!/httponly/i.test(cookie)) missing.push("HttpOnly");
      if (!/samesite/i.test(cookie)) missing.push("SameSite");
      if (missing.length > 0) {
        const name = cookie.split("=")[0]?.trim();
        findings.push({
          ruleId: "security/insecure-cookie-flags",
          title: `Cookie "${name}" missing recommended attributes`,
          severity: "medium",
          confidence: "high",
          evidence: { cookie: name ?? "unknown", missingAttributes: missing.join(", ") },
        });
      }
    }
  }

  // Mixed content: https page referencing http:// subresources
  if (isHttps) {
    const httpRefs = Array.from(
      res.bodyText.matchAll(/(?:src|href)=["']http:\/\/[^"']+["']/gi)
    ).map((m) => m[0]);
    if (httpRefs.length > 0) {
      findings.push({
        ruleId: "security/mixed-content",
        title: "Page references insecure (http://) resources",
        severity: "medium",
        confidence: "high",
        evidence: {
          count: String(httpRefs.length),
          sample: httpRefs.slice(0, 3).join(" | "),
        },
      });
    }
  }

  return findings;
}
