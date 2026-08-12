import express from "express";
import cors from "cors";
import { scanWebsiteRouter } from "./routes/scanWebsite.js";
import { scanSourceRouter } from "./routes/scanSource.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  })
);

app.use((_req, res, next) => {
  // Baseline security headers for the API itself.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "scanforge-api", version: "1.0.0" });
});

app.use("/api", scanWebsiteRouter);
app.use("/api", scanSourceRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => {
  console.log(`ScanForge API listening on http://localhost:${PORT}`);
});
