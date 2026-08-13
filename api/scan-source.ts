import type { VercelRequest, VercelResponse } from "@vercel/node";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import formidable from "formidable";
import { safeExtractZip, cleanupDir, UnsafeArchiveError } from "../server/security/safeZip.js";
import { scanSourceFiles } from "../server/scanner/sourceChecks.js";

// Vercel needs the raw body for multipart parsing — disable the default
// JSON body parser for this function only.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const form = formidable({
    maxFileSize: 30 * 1024 * 1024,
    filter: (part) => part.mimetype === "application/zip" || (part.originalFilename ?? "").endsWith(".zip"),
  });

  let filePath: string | undefined;
  const scanId = randomUUID();
  const destDir = path.join(os.tmpdir(), `scanforge-${scanId}`);

  try {
    const [, files] = await form.parse(req);
    const uploaded = files.archive?.[0];
    if (!uploaded) {
      res.status(400).json({ error: "No archive uploaded." });
      return;
    }
    filePath = uploaded.filepath;

    const extracted = await safeExtractZip(filePath, destDir);
    const findings = await scanSourceFiles(extracted);

    const risk = { low: 0, medium: 0, high: 0, critical: 0, anomalous: 0 };
    let counter = 1;
    const enriched = findings.map((f) => {
      risk[f.severity]++;
      if (f.anomalous) risk.anomalous++;
      return {
        id: `SRC-${String(counter++).padStart(3, "0")}`,
        ruleId: f.ruleId,
        category: "source",
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
        anomalous: f.anomalous ?? false,
        status: "open" as const,
        evidence: f.evidence,
        detectedAt: new Date().toISOString(),
      };
    });

    let penalty = 0;
    for (const f of enriched) {
      if (f.severity === "critical") penalty += 25;
      else if (f.severity === "high") penalty += 12;
      else if (f.severity === "medium") penalty += 6;
      else penalty += 2;
    }
    const codeQuality = Math.max(0, Math.min(100, 100 - penalty));

    res.status(200).json({
      id: scanId,
      mode: "source",
      status: "completed",
      filesScanned: extracted.length,
      score: { overall: codeQuality, codeQuality },
      risk,
      findings: enriched,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof UnsafeArchiveError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Source scan failed." });
  } finally {
    await cleanupDir(destDir);
    if (filePath) {
      try {
        await import("node:fs/promises").then((fs) => fs.unlink(filePath!));
      } catch {
        /* already gone */
      }
    }
  }
}
