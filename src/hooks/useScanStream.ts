import { useCallback, useRef, useState } from "react";
import { scanWebsiteStreamUrl } from "@/lib/api";
import type { Finding, ScanCheckState, ScoreBreakdown, RiskCounts } from "@/types/scanner";

interface ScanStreamState {
  status: "idle" | "connecting" | "running" | "completed" | "error";
  checks: Record<string, ScanCheckState>;
  findings: Finding[];
  score: (ScoreBreakdown & { overall: number }) | null;
  risk: RiskCounts | null;
  error: string | null;
}

const STAGE_ORDER: { id: string; category: ScanCheckState["category"]; label: string }[] = [
  { id: "security", category: "security", label: "Security" },
  { id: "web", category: "web", label: "Web Quality" },
  { id: "seo", category: "seo", label: "SEO" },
  { id: "accessibility", category: "accessibility", label: "Accessibility" },
  { id: "performance", category: "performance", label: "Performance" },
];

function initialChecks(): Record<string, ScanCheckState> {
  const map: Record<string, ScanCheckState> = {};
  for (const s of STAGE_ORDER) {
    map[s.id] = { id: s.id, category: s.category, label: s.label, status: "pending" };
  }
  return map;
}

export function useScanStream() {
  const [state, setState] = useState<ScanStreamState>({
    status: "idle",
    checks: initialChecks(),
    findings: [],
    score: null,
    risk: null,
    error: null,
  });
  const sourceRef = useRef<EventSource | null>(null);

  const start = useCallback((target: string) => {
    sourceRef.current?.close();
    setState({
      status: "connecting",
      checks: initialChecks(),
      findings: [],
      score: null,
      risk: null,
      error: null,
    });

    const es = new EventSource(scanWebsiteStreamUrl(target));
    sourceRef.current = es;

    es.addEventListener("connected", () => {
      setState((s) => ({ ...s, status: "running" }));
    });

    es.addEventListener("check_update", (e) => {
      const payload = JSON.parse((e as MessageEvent).data) as ScanCheckState;
      setState((s) => ({
        ...s,
        checks: { ...s.checks, [payload.id]: { ...s.checks[payload.id], ...payload } },
      }));
    });

    es.addEventListener("finding", (e) => {
      const finding = JSON.parse((e as MessageEvent).data) as Finding;
      setState((s) => ({ ...s, findings: [...s.findings, finding] }));
    });

    es.addEventListener("score", (e) => {
      const score = JSON.parse((e as MessageEvent).data);
      setState((s) => ({ ...s, score }));
    });

    es.addEventListener("complete", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      setState((s) => ({ ...s, status: "completed", risk: payload.risk ?? s.risk }));
      es.close();
    });

    es.addEventListener("error", (e) => {
      let message = "Connection to scanner lost.";
      const me = e as MessageEvent;
      if (me?.data) {
        try {
          message = JSON.parse(me.data).message ?? message;
        } catch {
          /* keep default */
        }
      }
      setState((s) => ({ ...s, status: "error", error: message }));
      es.close();
    });
  }, []);

  const stop = useCallback(() => {
    sourceRef.current?.close();
  }, []);

  return { ...state, start, stop };
}
