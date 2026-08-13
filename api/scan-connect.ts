import type { VercelRequest, VercelResponse } from "@vercel/node";
import { safeFetch, UnsafeTargetError } from "../server/security/safeFetch.js";

// Step 1 of a website scan. The browser calls this first; the response
// (headers + HTML, already fetched safely server-side) is then passed back
// to /api/scan-check for each category so no scan state needs to persist
// between serverless invocations.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const target = String(req.body?.target ?? "");
  if (!target) {
    res.status(400).json({ error: "Missing target URL." });
    return;
  }

  try {
    const result = await safeFetch(target);
    res.status(200).json({
      ok: result.ok,
      status: result.status,
      finalUrl: result.finalUrl,
      bodyText: result.bodyText,
      bodyTruncated: result.bodyTruncated,
      timingMs: result.timingMs,
      // Headers must be serialized explicitly — the Headers object itself
      // doesn't survive JSON.stringify.
      headers: Object.fromEntries(result.headers.entries()),
    });
  } catch (err) {
    if (err instanceof UnsafeTargetError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: "Could not reach target." });
  }
}
