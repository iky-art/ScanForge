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

export function ScanHistory() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scans")
      .select("id, target, overall_score, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setScans(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Scan History</h1>
      {loading ? (
        <p className="text-sm text-ink-dim font-mono">Loading...</p>
      ) : scans.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-sm text-ink-dim">No scans recorded yet.</p>
        </div>
      ) : (
        <div className="border border-line divide-y divide-line">
          {scans.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="truncate max-w-[45%]">{s.target}</span>
              <span className="font-mono text-xs text-ink-dim">
                {new Date(s.created_at).toLocaleString()}
              </span>
              <span className="font-mono text-xs">{s.overall_score ?? "–"}</span>
              <Link to={`/reports?scan=${s.id}`} className="font-mono text-xs text-accent hover:underline">
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
