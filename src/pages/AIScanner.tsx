import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface ScanOption {
  id: string;
  target: string;
  overall_score: number | null;
  created_at: string;
}

interface FindingRow {
  id: string;
  title: string;
  severity: string;
  category: string;
  evidence: Record<string, string>;
}

export function AIScanner() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scans")
      .select("id, target, overall_score, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setScans(data ?? []);
        if (data && data.length > 0) setSelectedId(data[0].id);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedId) return;
    setSummary(null);
    setError(null);
    supabase
      .from("findings")
      .select("id, title, severity, category, evidence")
      .eq("scan_id", selectedId)
      .then(({ data }) => setFindings(data ?? []));
  }, [selectedId]);

  async function handleGenerate() {
    const scan = scans.find((s) => s.id === selectedId);
    if (!scan) return;
    setGenerating(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: scan.target,
          overallScore: scan.overall_score ?? 0,
          findings: findings.map((f) => ({
            id: f.id,
            title: f.title,
            severity: f.severity,
            category: f.category,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI Scanner failed.");
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Scanner failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-sev-anomalous" strokeWidth={1.75} />
        <h1 className="text-xl font-semibold">AI Scanner</h1>
      </div>
      <p className="text-sm text-ink-dim mb-6 max-w-lg">
        Pick a completed scan below. AI Scanner explains and prioritizes the
        findings that scan already detected — it never invents new findings
        of its own.
      </p>

      {loading ? (
        <p className="text-sm text-ink-dim font-mono">Loading scans...</p>
      ) : scans.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-sm text-ink-dim">Run a scan first, then come back here to get an AI briefing on it.</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">Scan</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.target} — {new Date(s.created_at).toLocaleDateString()} (score: {s.overall_score ?? "–"})
                </option>
              ))}
            </select>
          </div>

          <div className="border border-line p-4 mb-6">
            <p className="font-mono text-xs text-ink-faint uppercase tracking-wide mb-2">
              {findings.length} finding{findings.length === 1 ? "" : "s"} on this scan
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="font-mono text-sm px-4 py-2.5 bg-sev-anomalous text-void font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate AI Briefing"}
            </button>
          </div>

          {error && <p className="text-sm text-sev-critical mb-6">{error}</p>}

          {summary && (
            <div className="border border-line p-5 bg-panel">
              <p className="font-mono text-[0.65rem] uppercase tracking-wide text-sev-anomalous mb-3">
                AI Briefing
              </p>
              <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{summary}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
