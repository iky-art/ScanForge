import { supabase } from "@/lib/supabase";
import type { Finding, ScanTargetMode } from "@/types/scanner";

interface PersistScanParams {
  target: string;
  mode: ScanTargetMode;
  score: number | null;
  findings: Finding[];
}

/**
 * Writes a completed scan and its findings to Supabase. Called client-side
 * with the signed-in user's session — Row Level Security on `scans` and
 * `findings` already restricts this to rows owned by that user, so no
 * separate backend endpoint is needed for it.
 */
export async function persistScan(userId: string, params: PersistScanParams): Promise<string | null> {
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      user_id: userId,
      target: params.target,
      scan_type: params.mode,
      status: "completed",
      overall_score: params.score,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    console.error("[ScanForge] Failed to save scan:", scanError?.message);
    return null;
  }

  if (params.findings.length > 0) {
    const rows = params.findings.map((f) => ({
      scan_id: scan.id,
      rule_id: f.ruleId,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      anomalous: f.anomalous,
      title: f.title,
      evidence: f.evidence,
    }));

    const { error: findingsError } = await supabase.from("findings").insert(rows);
    if (findingsError) {
      console.error("[ScanForge] Failed to save findings:", findingsError.message);
    }
  }

  return scan.id as string;
}
