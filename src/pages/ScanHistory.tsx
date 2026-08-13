import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

interface ScanRow {
  id: string;
  target: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

export function ScanHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this scan and all its findings? This can't be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("scans").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setScans((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t("nav.history")}</h1>
      {loading ? (
        <p className="text-sm text-ink-dim font-mono">Loading...</p>
      ) : scans.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-sm text-ink-dim">No scans recorded yet.</p>
        </div>
      ) : (
        <div className="border border-line divide-y divide-line">
          {scans.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="truncate max-w-[35%]">{s.target}</span>
              <span className="font-mono text-xs text-ink-dim hidden sm:inline">
                {new Date(s.created_at).toLocaleString()}
              </span>
              <span className="font-mono text-xs">{s.overall_score ?? "–"}</span>
              <div className="flex items-center gap-3">
                <Link to={`/reports?scan=${s.id}`} className="font-mono text-xs text-accent hover:underline">
                  Open
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="text-ink-faint hover:text-sev-critical transition-colors disabled:opacity-40"
                  aria-label="Delete scan"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
