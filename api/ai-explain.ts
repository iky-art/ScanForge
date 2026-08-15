import type { VercelRequest, VercelResponse } from "@vercel/node";

interface FindingInput {
  id: string;
  title: string;
  severity: string;
  category: string;
  evidence?: Record<string, string>;
}

function buildPrompt(target: string, overallScore: number, findings: FindingInput[]): string {
  // The prompt is deliberately framed to keep the model in an explain /
  // prioritize role over data ScanForge already found — it is never asked
  // to invent new findings, only to narrate and rank the real ones.
  const findingsBlock = findings
    .map((f) => `- [${f.severity.toUpperCase()}] (${f.category}) ${f.title}${f.id ? ` — id: ${f.id}` : ""}`)
    .join("\n");

  return [
    `You are assisting a developer in interpreting real security/quality scan results for the site "${target}".`,
    `Overall score: ${overallScore}/100.`,
    ``,
    `Here are the ACTUAL findings already detected by a deterministic scanner (do not invent, remove, or alter any of them — treat this list as ground truth):`,
    findingsBlock || "(no findings — the scan came back clean)",
    ``,
    `Write a short, practical remediation briefing for a developer:`,
    `1. A one-paragraph plain-language summary of overall risk.`,
    `2. A prioritized fix order (which findings to address first and why), referencing the findings above by title.`,
    `3. Keep it concise — this is a briefing, not a report. No markdown headers, just short paragraphs and a numbered list.`,
  ].join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const proxyUrl = process.env.VAL_TOWN_AI_URL;
  if (!proxyUrl) {
    res.status(503).json({ error: "AI Scanner is not configured on this deployment yet." });
    return;
  }

  const { target, overallScore, findings } = req.body ?? {};
  if (!target || !Array.isArray(findings)) {
    res.status(400).json({ error: "Missing target or findings." });
    return;
  }

  try {
    const prompt = buildPrompt(String(target), Number(overallScore ?? 0), findings);

    const upstream = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await upstream.json();

    if (!upstream.ok || !data.text) {
      res.status(502).json({ error: "AI Scanner could not generate a response right now." });
      return;
    }

    res.status(200).json({ summary: data.text });
  } catch (err) {
    console.error("[ScanForge] ai-explain failed:", err);
    res.status(500).json({ error: "AI Scanner request failed." });
  }
}
