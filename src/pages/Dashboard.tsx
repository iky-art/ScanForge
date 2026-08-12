import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface ScanRow {
  id: string;
  target: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, avgScore: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: scanRows } = await supabase
        .from("scans")
        .select("id, target, overall_score, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setScans(scanRows ?? []);

      const { data: findingCounts } = await supabase
        .from("findings")
        .select("severity");

      const critical = findingCounts?.filter((f) => f.severity === "critical").length ?? 0;
      const high = findingCounts?.filter((f) => f.severity === "high").length ?? 0;
      const avg =
        scanRows && scanRows.length > 0
          ? Math.round(
              scanRows.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / scanRows.length
            )
          : 0;

      setStats({ total: scanRows?.length ?? 0, critical, high, avgScore: avg });
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold">Good to see you again.</h1>
          <p className="text-sm text-ink-dim mt-1">Here's where things stand.</p>
        </div>
        <Link
          to="/scanner"
          className="font-mono text-sm px-4 py-2.5 bg-accent text-base-0 font-medium hover:bg-accent/90 transition-colors"
        >
          Start New Scan
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line mb-8">
        {[
          { label: "Total Scans", value: stats.total },
          { label: "Critical Findings", value: stats.critical },
          { label: "High Findings", value: stats.high },
          { label: "Avg. Security Score", value: stats.avgScore },
        ].map((s) => (
          <div key={s.label} className="bg-panel p-4">
            <div className="font-mono text-2xl">{loading ? "–" : s.value}</div>
            <div className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint mb-3">
        Recent Scans
      </h2>

      {loading ? (
        <p className="text-sm text-ink-dim font-mono">Loading...</p>
      ) : scans.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-sm text-ink-dim">No scans yet. Run your first one to see results here.</p>
        </div>
      ) : (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint border-b border-line">
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 truncate max-w-[200px]">{s.target}</td>
                  <td className="px-4 py-3 text-ink-dim font-mono text-xs">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.overall_score ?? "–"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-dim capitalize">{s.status}</td>
                  <td className="px-4 py-3">
                    <Link to={`/reports?scan=${s.id}`} className="font-mono text-xs text-accent hover:underline">
                      View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
