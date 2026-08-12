import { randomUUID } from "node:crypto";
import { safeFetch, assertUrlIsScannable } from "../security/safeFetch.js";
import { runSecurityChecks } from "./securityChecks.js";
import { runWebChecks } from "./webChecks.js";
import { runAccessibilityChecks } from "./accessibilityChecks.js";
import { runSeoChecks } from "./seoChecks.js";
import { runPerformanceChecks, computePerformanceMetrics } from "./performanceChecks.js";
import type { RawFinding } from "./types.js";

export type EmitFn = (event: { type: string; payload: unknown }) => void;

const STAGES = [
  { id: "connecting", category: "security", label: "Connecting" },
  { id: "security", category: "security", label: "Security" },
  { id: "web", category: "web", label: "Web Quality" },
  { id: "seo", category: "seo", label: "SEO" },
  { id: "accessibility", category: "accessibility", label: "Accessibility" },
  { id: "performance", category: "performance", label: "Performance" },
] as const;

function toFinding(raw: RawFinding, category: string, index: number) {
  const codePrefix = category.slice(0, 3).toUpperCase();
  return {
    id: `${codePrefix}-${String(index).padStart(3, "0")}`,
    ruleId: raw.ruleId,
    category,
    title: raw.title,
    severity: raw.severity,
    confidence: raw.confidence,
    anomalous: raw.anomalous ?? false,
    status: "open" as const,
    evidence: raw.evidence,
    detectedAt: new Date().toISOString(),
  };
}

function scoreFromFindings(findings: ReturnType<typeof toFinding>[], category: string) {
  const inCategory = findings.filter((f) => f.category === category);
  let penalty = 0;
  for (const f of inCategory) {
    if (f.severity === "critical") penalty += 25;
    else if (f.severity === "high") penalty += 12;
    else if (f.severity === "medium") penalty += 6;
    else penalty += 2;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

export async function runWebsiteScan(target: string, emit: EmitFn) {
  const scanId = randomUUID();
  emit({ type: "connecting", payload: { scanId, target } });

  await assertUrlIsScannable(target);
  const res = await safeFetch(target);
  emit({ type: "connected", payload: { finalUrl: res.finalUrl, status: res.status } });

  const allFindings: ReturnType<typeof toFinding>[] = [];
  let counter = 1;

  const runStage = async (
    id: string,
    category: string,
    label: string,
    fn: () => RawFinding[] | Promise<RawFinding[]>
  ) => {
    emit({ type: "check_update", payload: { id, category, label, status: "running" } });
    const started = Date.now();
    const raw = await fn();
    for (const r of raw) {
      const finding = toFinding(r, category, counter++);
      allFindings.push(finding);
      emit({ type: "finding", payload: finding });
    }
    emit({
      type: "check_update",
      payload: {
        id,
        category,
        label,
        status: raw.length > 0 ? "warning" : "passed",
        durationMs: Date.now() - started,
      },
    });
  };

  await runStage("security", "security", "Security", () => runSecurityChecks(res, target));
  await runStage("web", "web", "Web Quality", () => runWebChecks(res));
  await runStage("seo", "seo", "SEO", () => runSeoChecks(res));
  await runStage("accessibility", "accessibility", "Accessibility", () =>
    runAccessibilityChecks(res)
  );
  await runStage("performance", "performance", "Performance", () => runPerformanceChecks(res));

  const score = {
    security: scoreFromFindings(allFindings, "security"),
    performance: scoreFromFindings(allFindings, "performance"),
    seo: scoreFromFindings(allFindings, "seo"),
    accessibility: scoreFromFindings(allFindings, "accessibility"),
    codeQuality: 100, // website mode doesn't inspect source; stays neutral
  };
  const overall = Math.round(
    (score.security + score.performance + score.seo + score.accessibility) / 4
  );

  const risk = { low: 0, medium: 0, high: 0, critical: 0, anomalous: 0 };
  for (const f of allFindings) {
    risk[f.severity]++;
    if (f.anomalous) risk.anomalous++;
  }

  const metrics = computePerformanceMetrics(res);

  emit({
    type: "score",
    payload: { overall, ...score },
  });

  const summary = {
    id: scanId,
    target,
    finalUrl: res.finalUrl,
    mode: "website" as const,
    status: "completed" as const,
    score: { overall, ...score },
    risk,
    findings: allFindings,
    metrics,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  emit({ type: "complete", payload: summary });
  return summary;
}
