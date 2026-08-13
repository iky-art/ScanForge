import { supabase } from "@/lib/supabase";

const WINDOW_MINUTES = 5;
const MAX_SCANS_PER_WINDOW = 5;

/**
 * Because the scanner runs as stateless serverless functions with no
 * shared in-memory store, per-IP rate limiting (like a traditional Express
 * server would do) isn't available here. Instead, this checks the user's
 * own recently-persisted scan count in Supabase — enforced client-side
 * before starting a new scan. This is a soft limit (a user could in theory
 * call the API functions directly to bypass it), not a substitute for
 * server-side protection, but it does stop accidental rapid-fire scanning
 * from the UI itself.
 */
export async function checkScanRateLimit(
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (error) {
    // Fail open — a rate-limit check failing shouldn't block a legitimate
    // scan; it just means this particular safeguard didn't run this time.
    return { allowed: true };
  }

  if ((count ?? 0) >= MAX_SCANS_PER_WINDOW) {
    return {
      allowed: false,
      message: `You've hit the limit of ${MAX_SCANS_PER_WINDOW} scans per ${WINDOW_MINUTES} minutes. Please wait a bit before starting another.`,
    };
  }

  return { allowed: true };
}
