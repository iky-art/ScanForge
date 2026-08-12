import type { RiskCounts, Severity } from "@/types/scanner";

type FilterValue = Severity | "anomalous" | null;

const CARDS: { key: keyof RiskCounts; label: string; color: string }[] = [
  { key: "low", label: "Low", color: "text-sev-low border-sev-low/40" },
  { key: "medium", label: "Medium", color: "text-sev-medium border-sev-medium/40" },
  { key: "high", label: "High", color: "text-sev-high border-sev-high/40" },
  { key: "critical", label: "Critical", color: "text-sev-critical border-sev-critical/40" },
  { key: "anomalous", label: "Anomalous", color: "text-sev-anomalous border-sev-anomalous/40" },
];

export function RiskCards({
  risk,
  active,
  onSelect,
}: {
  risk: RiskCounts;
  active: FilterValue;
  onSelect: (value: FilterValue) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border border-line">
      {CARDS.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(isActive ? null : (c.key as FilterValue))}
            className={`bg-panel px-4 py-4 text-left transition-colors ${
              isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
            }`}
          >
            <div className={`font-mono text-2xl ${c.color.split(" ")[0]}`}>{risk[c.key]}</div>
            <div className="font-mono text-[0.68rem] uppercase tracking-wide text-ink-faint mt-1">
              {c.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
