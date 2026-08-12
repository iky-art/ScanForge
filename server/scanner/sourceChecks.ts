import fs from "node:fs/promises";
import path from "node:path";
import type { RawFinding } from "./types.js";

// Each pattern is intentionally generic-shaped (prefix + long token) so this
// stays a defensive linting aid, not a targeted key-format cracker.
const SECRET_PATTERNS: { ruleId: string; title: string; regex: RegExp; severity: RawFinding["severity"] }[] = [
  {
    ruleId: "source/exposed-generic-api-key",
    title: "Possible API key pattern found",
    regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi,
    severity: "high",
  },
  {
    ruleId: "source/hardcoded-credential",
    title: "Possible hardcoded credential",
    regex: /(?:password|passwd|secret)\s*[:=]\s*["'][^"'\s]{6,}["']/gi,
    severity: "critical",
  },
  {
    ruleId: "source/aws-key-pattern",
    title: "Pattern resembling an AWS access key",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "critical",
  },
  {
    ruleId: "source/private-key-block",
    title: "Embedded private key block",
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
    severity: "critical",
  },
];

const DANGEROUS_JS_PATTERNS: { ruleId: string; title: string; regex: RegExp; severity: RawFinding["severity"] }[] = [
  {
    ruleId: "source/eval-usage",
    title: "Use of eval()",
    regex: /\beval\s*\(/g,
    severity: "high",
  },
  {
    ruleId: "source/innerhtml-concat",
    title: "innerHTML assigned from concatenated/dynamic value",
    regex: /\.innerHTML\s*=\s*[^"'`][^;]*[+`]/g,
    severity: "medium",
  },
  {
    ruleId: "source/insecure-http-url",
    title: "Hardcoded insecure http:// URL",
    regex: /["']http:\/\/(?!localhost|127\.0\.0\.1)[^"'\s]+["']/g,
    severity: "low",
  },
  {
    ruleId: "source/new-function",
    title: "Use of new Function() (equivalent to eval)",
    regex: /new\s+Function\s*\(/g,
    severity: "high",
  },
];

export async function scanSourceFiles(filePaths: string[]): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];
  const seen = new Map<string, number>(); // ruleId -> count, so we roll up instead of spamming

  for (const filePath of filePaths) {
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      continue; // unreadable/binary — skip, never attempt to execute or force-parse
    }
    const relative = path.basename(filePath);

    for (const pattern of [...SECRET_PATTERNS, ...DANGEROUS_JS_PATTERNS]) {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        const key = pattern.ruleId;
        seen.set(key, (seen.get(key) ?? 0) + matches.length);
        // Only push once per rule with an evidence sample + file reference;
        // aggregate counts across the whole upload rather than one finding
        // per line (avoids findings-list spam on large repos).
        const existing = findings.find((f) => f.ruleId === key);
        if (existing) {
          existing.evidence.occurrences = String(seen.get(key));
          existing.evidence.files = existing.evidence.files.includes(relative)
            ? existing.evidence.files
            : `${existing.evidence.files}, ${relative}`;
        } else {
          findings.push({
            ruleId: pattern.ruleId,
            title: pattern.title,
            severity: pattern.severity,
            confidence: "medium",
            evidence: { occurrences: String(matches.length), files: relative },
          });
        }
      }
    }

    // Malformed JSON check for .json files
    if (filePath.endsWith(".json")) {
      try {
        JSON.parse(content);
      } catch {
        findings.push({
          ruleId: "source/malformed-json",
          title: `Malformed JSON in ${relative}`,
          severity: "low",
          confidence: "high",
          evidence: { file: relative },
        });
      }
    }
  }

  return findings;
}
