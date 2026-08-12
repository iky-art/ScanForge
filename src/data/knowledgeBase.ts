import type { RuleDoc } from "@/types/scanner";

// Each entry here corresponds 1:1 to a ruleId produced by server/scanner/*.
// The documentation panel looks up findings by ruleId against this map — it
// never generates explanations on the fly, so every doc is reviewed content,
// not AI-generated text at runtime.
export const knowledgeBase: Record<string, RuleDoc> = {
  "security/missing-csp": {
    ruleId: "security/missing-csp",
    code: "SEC-HEADER-001",
    title: "Missing Content-Security-Policy",
    category: "security",
    whatWasDetected:
      "The response did not include a Content-Security-Policy header.",
    whyItMatters:
      "CSP restricts which sources of scripts, styles, and other resources the browser is allowed to load. Without it, a successful injection (e.g. XSS) has far more room to execute arbitrary script or exfiltrate data.",
    evidenceTemplate: "Header: Content-Security-Policy — Status: Not detected",
    defaultSeverity: "high",
    howToFix:
      "Add a Content-Security-Policy header, starting narrow (default-src 'self') and widening only for sources you actually use.",
    howToPrevent:
      "Set security headers at the edge (reverse proxy / CDN / framework middleware) so new routes inherit them automatically.",
    howToVerify:
      "Re-run the scan, or check response headers directly with curl -I against the target.",
    references: [
      { label: "MDN — Content-Security-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy" },
    ],
  },
  "security/missing-hsts": {
    ruleId: "security/missing-hsts",
    code: "SEC-HEADER-002",
    title: "Missing Strict-Transport-Security",
    category: "security",
    whatWasDetected: "No Strict-Transport-Security (HSTS) header was returned over HTTPS.",
    whyItMatters:
      "Without HSTS, browsers may still attempt a plain HTTP connection first, leaving a window for downgrade or man-in-the-middle attacks.",
    evidenceTemplate: "Header: Strict-Transport-Security — Status: Not detected",
    defaultSeverity: "high",
    howToFix:
      "Add Strict-Transport-Security: max-age=31536000; includeSubDomains once you're confident all subdomains support HTTPS.",
    howToPrevent: "Enable HSTS at the load balancer or web server config, not per-route.",
    howToVerify: "Check response headers after redeploying; confirm the header persists across routes.",
    references: [{ label: "MDN — Strict-Transport-Security", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security" }],
  },
  "security/no-https": {
    ruleId: "security/no-https",
    code: "SEC-TLS-001",
    title: "Site not served over HTTPS",
    category: "security",
    whatWasDetected: "The final response was served over plain HTTP, not HTTPS.",
    whyItMatters:
      "Traffic (including any credentials or session cookies) can be read or modified in transit by anyone on the network path.",
    evidenceTemplate: "Final URL scheme: http://",
    defaultSeverity: "critical",
    howToFix: "Provision a TLS certificate and serve the site exclusively over HTTPS.",
    howToPrevent: "Redirect all HTTP traffic to HTTPS at the server/load-balancer level.",
    howToVerify: "Load the site and confirm the browser shows a secure connection with no mixed-content warnings.",
    references: [{ label: "Let's Encrypt", url: "https://letsencrypt.org/" }],
  },
  "security/mixed-content": {
    ruleId: "security/mixed-content",
    code: "SEC-MIXED-001",
    title: "Insecure (http://) resource references on an HTTPS page",
    category: "security",
    whatWasDetected: "The page is served over HTTPS but references one or more resources over plain HTTP.",
    whyItMatters:
      "Mixed content can be blocked by the browser (breaking functionality) or, for passive content, tampered with in transit.",
    evidenceTemplate: "Sample references detected in page HTML.",
    defaultSeverity: "medium",
    howToFix: "Update the affected src/href values to https:// or protocol-relative URLs.",
    howToPrevent: "Lint for hardcoded http:// URLs in CI before merge.",
    howToVerify: "Reload the page and confirm the browser console shows no mixed-content warnings.",
    references: [{ label: "MDN — Mixed content", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" }],
  },
  "web/missing-viewport": {
    ruleId: "web/missing-viewport",
    code: "WEB-META-001",
    title: "Missing viewport meta tag",
    category: "web",
    whatWasDetected: "No <meta name=\"viewport\"> tag was found in the document head.",
    whyItMatters: "Without it, mobile browsers render the page at desktop width and scale it down, producing a poor, hard-to-read layout.",
    evidenceTemplate: "Status: Not detected",
    defaultSeverity: "high",
    howToFix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to <head>.",
    howToPrevent: "Include it in your base HTML template so every page inherits it.",
    howToVerify: "View the page on a mobile device or emulator and confirm it renders at the correct scale.",
    references: [{ label: "MDN — Viewport meta tag", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag" }],
  },
  "performance/no-compression": {
    ruleId: "performance/no-compression",
    code: "PERF-COMP-001",
    title: "Response not served with compression",
    category: "performance",
    whatWasDetected: "The response had no Content-Encoding header (e.g. gzip, br).",
    whyItMatters: "Uncompressed text responses transfer more bytes than necessary, slowing page loads especially on constrained networks.",
    evidenceTemplate: "Header: Content-Encoding — Status: Not detected",
    defaultSeverity: "medium",
    howToFix: "Enable gzip or brotli compression at your web server or CDN.",
    howToPrevent: "Make compression part of your default server config, not an opt-in per route.",
    howToVerify: "Re-check response headers for Content-Encoding after enabling it.",
    references: [{ label: "web.dev — Text compression", url: "https://web.dev/uses-text-compression/" }],
  },
  "accessibility/missing-form-labels": {
    ruleId: "accessibility/missing-form-labels",
    code: "A11Y-FORM-001",
    title: "Form inputs missing associated labels",
    category: "accessibility",
    whatWasDetected: "One or more form inputs had no matching <label for>, aria-label, or aria-labelledby.",
    whyItMatters: "Screen reader users can't tell what an unlabeled input is for, making forms difficult or impossible to complete.",
    evidenceTemplate: "Count of unlabeled inputs detected.",
    defaultSeverity: "high",
    howToFix: "Associate each input with a <label for=\"id\">, or add aria-label / aria-labelledby directly.",
    howToPrevent: "Add a component-library rule so form fields can't ship without a label.",
    howToVerify: "Navigate the form with a screen reader (or axe DevTools) and confirm every field announces a name.",
    references: [{ label: "WebAIM — Forms", url: "https://webaim.org/techniques/forms/" }],
  },
  "seo/noindex-detected": {
    ruleId: "seo/noindex-detected",
    code: "SEO-INDEX-001",
    title: "Page marked noindex",
    category: "seo",
    whatWasDetected: "A robots meta tag containing \"noindex\" was found.",
    whyItMatters: "Search engines will not index this page, which is often unintentional and can silently remove pages from search results.",
    evidenceTemplate: "Meta robots content value as detected.",
    defaultSeverity: "high",
    howToFix: "Remove the noindex directive if the page should be discoverable, or confirm it's intentional if not.",
    howToPrevent: "Review robots meta tags as part of your pre-deploy checklist, especially for staging-to-production promotions.",
    howToVerify: "View page source and confirm the robots meta tag no longer contains noindex.",
    references: [{ label: "Google Search Central — robots meta tag", url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag" }],
  },
  "source/hardcoded-credential": {
    ruleId: "source/hardcoded-credential",
    code: "SRC-CRED-001",
    title: "Possible hardcoded credential",
    category: "source",
    whatWasDetected: "A pattern resembling a hardcoded password or secret assignment was found in the uploaded source.",
    whyItMatters: "Credentials committed to source code can leak through version history, forks, or logs, and are hard to rotate once exposed.",
    evidenceTemplate: "File name and occurrence count.",
    defaultSeverity: "critical",
    howToFix: "Move the value to an environment variable or secrets manager, then rotate the exposed credential.",
    howToPrevent: "Add a pre-commit secret scanner and .env-based config to your workflow.",
    howToVerify: "Re-scan the source after removal and confirm the pattern no longer appears.",
    references: [{ label: "OWASP — Secrets Management", url: "https://owasp.org/www-project-secrets-management-cheat-sheet/" }],
  },
};

export function getRuleDoc(ruleId: string): RuleDoc | null {
  return knowledgeBase[ruleId] ?? null;
}
