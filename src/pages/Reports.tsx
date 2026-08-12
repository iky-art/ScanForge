import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function Reports() {
  const [params] = useSearchParams();
  const scanId = params.get("scan");
  const [scan, setScan] = useState<any | null>(null);
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    if (!scanId) return;
    supabase.from("scans").select("*").eq("id", scanId).single().then(({ data }) => setScan(data));
    supabase.from("findings").select("*").eq("scan_id", scanId).then(({ data }) => setFindings(data ?? []));
  }, [scanId]);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ scan, findings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scanforge-report-${scanId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!scanId) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Reports</h1>
        <p className="text-sm text-ink-dim">Select a scan from Dashboard or Scan History to view its report.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Report</h1>
        <button
          onClick={exportJson}
          className="font-mono text-xs border border-line-strong px-3 py-1.5 hover:border-accent transition-colors"
        >
          Export JSON
        </button>
      </div>
      {!scan ? (
        <p className="text-sm text-ink-dim font-mono">Loading...</p>
      ) : (
        <>
          <div className="border border-line p-4 mb-6 font-mono text-sm">
            <div>Target: {scan.target}</div>
            <div className="text-ink-dim mt-1">Score: {scan.overall_score ?? "–"}</div>
          </div>
          <div className="border border-line divide-y divide-line">
            {findings.map((f) => (
              <div key={f.id} className="px-4 py-3 text-sm flex justify-between">
                <span>{f.title}</span>
                <span className="font-mono text-xs uppercase text-ink-faint">{f.severity}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
