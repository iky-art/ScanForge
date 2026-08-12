import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { safeExtractZip, cleanupDir, UnsafeArchiveError } from "../security/safeZip.js";
import { scanSourceFiles } from "../scanner/sourceChecks.js";
import { scanRateLimit } from "../middleware/rateLimit.js";

export const scanSourceRouter = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB upload cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/zip" && !file.originalname.endsWith(".zip")) {
      return cb(new Error("Only .zip files are accepted."));
    }
    cb(null, true);
  },
});

scanSourceRouter.post("/scan/source", scanRateLimit, upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No archive uploaded." });
  }

  const scanId = randomUUID();
  const destDir = path.join(os.tmpdir(), `scanforge-${scanId}`);

  try {
    const files = await safeExtractZip(req.file.path, destDir);
    const findings = await scanSourceFiles(files);

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

    res.json({
      id: scanId,
      mode: "source",
      status: "completed",
      filesScanned: files.length,
      score: { overall: codeQuality, codeQuality },
      risk,
      findings: enriched,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof UnsafeArchiveError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Source scan failed." });
  } finally {
    await cleanupDir(destDir);
    // multer's temp upload file too
    try {
      await import("node:fs/promises").then((fs) => fs.unlink(req.file!.path));
    } catch {
      /* already gone — fine */
    }
  }
});
