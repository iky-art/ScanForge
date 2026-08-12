import { X } from "lucide-react";
import type { Finding } from "@/types/scanner";
import { getRuleDoc } from "@/data/knowledgeBase";
import { SeverityBadge, ConfidenceLabel } from "./Badges";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-line last:border-b-0">
      <h4 className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-accent mb-2">
        {title}
      </h4>
      <div className="text-sm text-ink-dim leading-relaxed">{children}</div>
    </div>
  );
}

export function DocumentationPanel({
  finding,
  onClose,
}: {
  finding: Finding | null;
  onClose: () => void;
}) {
  if (!finding) return null;

  const doc = getRuleDoc(finding.ruleId);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg h-full bg-base-1 border-l border-line overflow-y-auto">
        <div className="sticky top-0 bg-base-1 border-b border-line px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-ink-faint">{doc?.code ?? finding.id}</div>
            <h3 className="text-lg font-semibold text-ink mt-1">{doc?.title ?? finding.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <SeverityBadge severity={finding.severity} />
              <ConfidenceLabel confidence={finding.confidence} />
            </div>
          </div>
          <button onClick={onClose} className="text-ink-dim hover:text-ink shrink-0" aria-label="Close documentation">
            <X size={18} />
          </button>
        </div>

        <div className="px-5">
          <Section title="What was detected">
            {doc?.whatWasDetected ?? finding.description ?? "Details for this finding."}
          </Section>

          {doc && <Section title="Why it matters">{doc.whyItMatters}</Section>}

          <Section title="Evidence">
            <div className="font-mono text-xs bg-panel border border-line p-3 space-y-1">
              {Object.entries(finding.evidence).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-ink-faint">{k}:</span>
                  <span className="text-ink break-all">{v}</span>
                </div>
              ))}
            </div>
          </Section>

          {doc && (
            <>
              <Section title="How to fix">{doc.howToFix}</Section>
              <Section title="How to prevent">{doc.howToPrevent}</Section>
              <Section title="How to verify">{doc.howToVerify}</Section>
              {doc.references.length > 0 && (
                <Section title="References">
                  <ul className="space-y-1">
                    {doc.references.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {!doc && (
            <Section title="Note">
              Extended remediation guidance for this rule is being written. The
              evidence above reflects exactly what the scanner detected.
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
