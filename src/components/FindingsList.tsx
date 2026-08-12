import type { Finding, Severity } from "@/types/scanner";
import { SeverityBadge } from "./Badges";

export function FindingsList({
  findings,
  filter,
  onOpen,
}: {
  findings: Finding[];
  filter: Severity | "anomalous" | null;
  onOpen: (finding: Finding) => void;
}) {
  const visible = findings.filter((f) => {
    if (!filter) return true;
    if (filter === "anomalous") return f.anomalous;
    return f.severity === filter;
  });

  if (visible.length === 0) {
    return (
      <div className="border border-line p-8 text-center">
        <p className="font-mono text-sm text-ink-dim">
          {findings.length === 0 ? "No findings yet." : "No findings match this filter."}
        </p>
      </div>
    );
  }

  return (
    <ul className="border border-line divide-y divide-line">
      {visible.map((f) => (
        <li key={f.id}>
          <button
            onClick={() => onOpen(f)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
          >
            <span className="font-mono text-[0.65rem] text-ink-faint w-24 shrink-0">{f.id}</span>
            <span className="flex-1 text-sm text-ink truncate">{f.title}</span>
            {f.anomalous && (
              <span className="font-mono text-[0.6rem] text-sev-anomalous border border-sev-anomalous/40 px-1.5 py-0.5">
                ANOMALOUS
              </span>
            )}
            <SeverityBadge severity={f.severity} />
          </button>
        </li>
      ))}
    </ul>
  );
}
