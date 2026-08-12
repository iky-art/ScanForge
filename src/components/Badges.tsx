import type { Severity, CheckStatus, Confidence } from "@/types/scanner";

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "text-sev-critical border-sev-critical/50 bg-sev-critical/10",
  high: "text-sev-high border-sev-high/50 bg-sev-high/10",
  medium: "text-sev-medium border-sev-medium/50 bg-sev-medium/10",
  low: "text-sev-low border-sev-low/50 bg-sev-low/10",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`font-mono text-[0.65rem] uppercase tracking-wide px-1.5 py-0.5 border ${SEVERITY_STYLE[severity]}`}
    >
      {severity}
    </span>
  );
}

export function ConfidenceLabel({ confidence }: { confidence: Confidence }) {
  return (
    <span className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-wide">
      Confidence: <span className="text-ink-dim">{confidence}</span>
    </span>
  );
}

const STATUS_DOT: Record<CheckStatus, string> = {
  pending: "bg-ink-faint",
  running: "bg-accent animate-pulse",
  passed: "bg-emerald-400",
  warning: "bg-sev-high",
  failed: "bg-sev-critical",
  skipped: "bg-ink-faint",
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pending: "Waiting",
  running: "Analyzing...",
  passed: "Passed",
  warning: "Findings detected",
  failed: "Failed",
  skipped: "Skipped",
};

export function CheckStatusRow({ label, status }: { label: string; status: CheckStatus }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-b-0">
      <span className="font-mono text-sm text-ink">{label.toUpperCase()}</span>
      <span className="flex items-center gap-2 font-mono text-xs text-ink-dim">
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
