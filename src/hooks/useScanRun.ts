import { useCallback, useState } from "react";
import type { Finding, ScanCheckState, RiskCounts } from "@/types/scanner";

interface ScoreShape {
  overall: number;
  security: number;
  performance: number;
  seo: number;
  accessibility: number;
  codeQuality: number;
}

interface ScanRunState {
  status: "idle" | "connecting" | "running" | "completed" | "error";
  checks: Record<string, ScanCheckState>;
  findings: Finding[];
  score: ScoreShape | null;
  risk: RiskCounts | null;
  error: string | null;
}

const STAGES: { id: string; category: ScanCheckState["category"]; label: string }[] = [
  { id: "security", category: "security", label: "Security" },
  { id: "web", category: "web", label: "Web Quality" },
  { id: "seo", category: "seo", label: "SEO" },
  { id: "accessibility", category: "accessibility", label: "Accessibility" },
  { id: "performance", category: "performance", label: "Performance" },
];

function initialChecks(): Record<string, ScanCheckState> {
  const map: Record<string, ScanCheckState> = {};
  for (const s of STAGES) {
    map[s.id] = { id: s.id, category: s.category, label: s.label, status: "pending" };
  }
  return map;
}

function scoreFromFindings(findings: Finding[], category: string): number {
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

/**
 * Runs a website scan as a sequence of small, stateless calls instead of a
 * long-lived SSE connection — this is what makes the scanner work on
 * serverless functions (Vercel) with short execution limits, while still
 * giving the UI a real-time, check-by-check progressive reveal.
 */
export function useScanRun() {
  const [state, setState] = useState<ScanRunState>({
    status: "idle",
    checks: initialChecks(),
    findings: [],
    score: null,
    risk: null,
    error: null,
  });

  const start = useCallback(async (target: string) => {
    setState({
      status: "connecting",
      checks: initialChecks(),
      findings: [],
      score: null,
      risk: null,
      error: null,
    });

    try {
      const connectRes = await fetch("/api/scan-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const connectData = await connectRes.json();
      if (!connectRes.ok) {
        throw new Error(connectData.error ?? "Could not reach target.");
      }

      setState((s) => ({ ...s, status: "running" }));

      const allFindings: Finding[] = [];

      for (const stage of STAGES) {
        setState((s) => ({
          ...s,
          checks: { ...s.checks, [stage.id]: { ...s.checks[stage.id], status: "running" } },
        }));

        const started = Date.now();
        const checkRes = await fetch("/api/scan-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: stage.category, target, connect: connectData }),
        });
        const checkData = await checkRes.json();

        if (!checkRes.ok) {
          setState((s) => ({
            ...s,
            checks: { ...s.checks, [stage.id]: { ...s.checks[stage.id], status: "failed" } },
          }));
          continue;
        }

        const findings: Finding[] = checkData.findings ?? [];
        allFindings.push(...findings);

        setState((s) => ({
          ...s,
          findings: [...s.findings, ...findings],
          checks: {
            ...s.checks,
            [stage.id]: {
              ...s.checks[stage.id],
              status: findings.length > 0 ? "warning" : "passed",
              durationMs: Date.now() - started,
            },
          },
        }));
      }

      const score: ScoreShape = {
        overall: 0,
        security: scoreFromFindings(allFindings, "security"),
        performance: scoreFromFindings(allFindings, "performance"),
        seo: scoreFromFindings(allFindings, "seo"),
        accessibility: scoreFromFindings(allFindings, "accessibility"),
        codeQuality: 100,
      };
      score.overall = Math.round(
        (score.security + score.performance + score.seo + score.accessibility) / 4
      );

      const risk: RiskCounts = { low: 0, medium: 0, high: 0, critical: 0, anomalous: 0 };
      for (const f of allFindings) {
        risk[f.severity]++;
        if (f.anomalous) risk.anomalous++;
      }

      setState((s) => ({ ...s, status: "completed", score, risk }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Scan failed.",
      }));
    }
  }, []);

  const stop = useCallback(() => {
    // Each step is a short, independent request — nothing to tear down.
  }, []);

  return { ...state, start, stop };
}
