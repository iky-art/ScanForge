import { useEffect, useRef, useState } from "react";
import { useScanRun } from "@/hooks/useScanRun";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { persistScan } from "@/lib/persistScan";
import { checkScanRateLimit } from "@/lib/rateLimit";
import { CheckStatusRow } from "@/components/Badges";
import { RiskCards } from "@/components/RiskCards";
import { FindingsList } from "@/components/FindingsList";
import { DocumentationPanel } from "@/components/DocumentationPanel";
import { ScanForgeCore, type CoreState } from "@/three/ScanForgeCore";
import { scanSourceUpload } from "@/lib/api";
import type { Finding, Severity } from "@/types/scanner";

type Mode = "website" | "source";

function coreStateFor(status: string): CoreState {
  if (status === "connecting" || status === "running") return "scanning";
  if (status === "completed") return "complete";
  if (status === "error") return "error";
  return "idle";
}

export function Scanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("website");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [filter, setFilter] = useState<Severity | "anomalous" | null>(null);

  const stream = useScanRun();
  const websitePersistedRef = useRef(false);

  const [sourceResult, setSourceResult] = useState<any | null>(null);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Save the completed website scan (and its findings) to Supabase once,
  // right when it finishes — this is what makes Dashboard/History/Reports
  // show real data instead of staying permanently empty.
  useEffect(() => {
    if (stream.status === "connecting") {
      websitePersistedRef.current = false;
      return;
    }
    if (
      stream.status === "completed" &&
      stream.score &&
      user &&
      !websitePersistedRef.current
    ) {
      websitePersistedRef.current = true;
      persistScan(user.id, {
        target: url,
        mode: "website",
        score: stream.score.overall,
        findings: stream.findings,
      });
    }
  }, [stream.status, stream.score, stream.findings, user, url]);

  async function startWebsiteScan(target: string) {
    setRateLimitError(null);
    if (user) {
      const check = await checkScanRateLimit(user.id);
      if (!check.allowed) {
        setRateLimitError(check.message ?? "Rate limit reached.");
        return;
      }
    }
    stream.start(target);
  }

  async function handleSourceUpload(file: File) {
    setRateLimitError(null);
    if (user) {
      const check = await checkScanRateLimit(user.id);
      if (!check.allowed) {
        setRateLimitError(check.message ?? "Rate limit reached.");
        return;
      }
    }
    setSourceBusy(true);
    setSourceError(null);
    setSourceResult(null);
    try {
      const result = await scanSourceUpload(file);
      setSourceResult(result);
      if (user) {
        persistScan(user.id, {
          target: file.name,
          mode: "source",
          score: result.score?.overall ?? null,
          findings: result.findings ?? [],
        });
      }
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setSourceBusy(false);
    }
  }

  const activeFindings = mode === "website" ? stream.findings : sourceResult?.findings ?? [];
  const activeRisk =
    mode === "website"
      ? stream.risk ?? { low: 0, medium: 0, high: 0, critical: 0, anomalous: 0 }
      : sourceResult?.risk ?? { low: 0, medium: 0, high: 0, critical: 0, anomalous: 0 };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">{t("scanner.title")}</h1>
      <p className="text-sm text-ink-dim mb-6">{t("scanner.subtitle")}</p>

      <div className="flex gap-1 mb-6 font-mono text-xs">
        {(["website", "source"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 border ${
              mode === m ? "border-accent text-accent" : "border-line text-ink-dim"
            }`}
          >
            {m === "website" ? t("scanner.website") : t("scanner.source")}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_180px] gap-6 items-start mb-8">
        <div>
          {mode === "website" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) startWebsiteScan(url.trim());
              }}
              className="flex gap-2"
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="flex-1 bg-panel border border-line px-3 py-2.5 text-sm font-mono focus:border-accent outline-none"
              />
              <button
                type="submit"
                disabled={stream.status === "connecting" || stream.status === "running"}
                className="font-mono text-sm px-5 bg-accent text-base-0 font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {t("scanner.startScan")}
              </button>
            </form>
          ) : (
            <label className="flex flex-col items-center justify-center border border-dashed border-line-strong py-8 cursor-pointer hover:border-accent transition-colors">
              <span className="font-mono text-sm text-ink-dim">
                {sourceBusy ? t("scanner.scanning") : t("scanner.uploadZip")}
              </span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSourceUpload(file);
                }}
              />
            </label>
          )}
          {sourceError && <p className="text-sm text-sev-critical mt-2">{sourceError}</p>}
          {rateLimitError && <p className="text-sm text-sev-high mt-2">{rateLimitError}</p>}
        </div>

        <div className="h-24 md:h-32 hidden sm:block">
          <ScanForgeCore
            state={mode === "website" ? coreStateFor(stream.status) : sourceBusy ? "scanning" : "idle"}
            className="w-full h-full"
          />
        </div>
      </div>

      {mode === "website" && stream.status !== "idle" && (
        <div className="border border-line mb-8">
          {Object.values(stream.checks).map((c) => (
            <div key={c.id} className="px-4">
              <CheckStatusRow label={c.label} status={c.status} />
            </div>
          ))}
        </div>
      )}

      {stream.error && <p className="text-sm text-sev-critical mb-6">{stream.error}</p>}

      {(stream.status === "completed" || sourceResult) && (
        <>
          {stream.score && mode === "website" && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border border-line mb-6">
              {[
                { label: "Overall", value: stream.score.overall },
                { label: "Security", value: stream.score.security },
                { label: "Performance", value: stream.score.performance },
                { label: "SEO", value: stream.score.seo },
                { label: "Accessibility", value: stream.score.accessibility },
              ].map((s) => (
                <div key={s.label} className="bg-panel p-4">
                  <div className="font-mono text-2xl">{s.value}</div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <RiskCards risk={activeRisk} active={filter} onSelect={setFilter} />
          </div>

          <FindingsList findings={activeFindings} filter={filter} onOpen={setSelected} />
        </>
      )}

      <DocumentationPanel finding={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
