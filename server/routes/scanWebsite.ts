import { Router } from "express";
import { runWebsiteScan } from "../scanner/orchestrator.js";
import { UnsafeTargetError } from "../security/safeFetch.js";
import { scanRateLimit } from "../middleware/rateLimit.js";

export const scanWebsiteRouter = Router();

// GET so it can be opened directly as an EventSource from the browser.
// ?target=<url> is validated server-side before anything happens.
scanWebsiteRouter.get("/scan/website", scanRateLimit, async (req, res) => {
  const target = String(req.query.target ?? "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: { type: string; payload: unknown }) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
  };

  const heartbeat = setInterval(() => res.write(":\n\n"), 15000);

  try {
    if (!target) {
      throw new UnsafeTargetError("Missing target URL.");
    }
    await runWebsiteScan(target, send);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    send({ type: "error", payload: { message } });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});
