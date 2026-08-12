// Shared types used by frontend, and mirrored (loosely) by server/types.ts.
// Keep this file the single source of truth for the scanning domain model.

export type ScanTargetMode = "website" | "source";

export type CheckStatus =
  | "pending"
  | "running"
  | "passed"
  | "warning"
  | "failed"
  | "skipped";

// Per-finding severity (fine-grained, used on finding cards/docs).
export type Severity = "low" | "medium" | "high" | "critical";

export type Confidence = "low" | "medium" | "high";

export type ScanCategory =
  | "security"
  | "web"
  | "performance"
  | "accessibility"
  | "seo"
  | "source";

export interface ScanCheckState {
  id: string;
  category: ScanCategory;
  label: string;
  status: CheckStatus;
  startedAt?: string;
  durationMs?: number;
  detail?: string;
}

export interface Finding {
  id: string; // e.g. SEC-HEADER-001
  ruleId: string; // knowledge base key, e.g. security/missing-csp
  category: ScanCategory;
  title: string;
  severity: Severity;
  confidence: Confidence;
  // Anomalous is orthogonal to severity: it flags an unusual/inconclusive
  // result that needs a human look, independent of how severe it is.
  anomalous: boolean;
  status: "open" | "acknowledged" | "resolved";
  evidence: Record<string, string>;
  detectedAt: string;
  description: string;
  impact: string;
}

export interface ScoreBreakdown {
  overall: number;
  security: number;
  performance: number;
  seo: number;
  accessibility: number;
  codeQuality: number;
}

// Dashboard risk-classification counts. The spec calls out LOW/HIGH/CRITICAL
// as the primary severity buckets; MEDIUM is kept as its own count (findings
// do use it) rather than silently folded into HIGH. ANOMALOUS is a separate,
// orthogonal count — "unusual, needs a closer look" — not a severity level.
export interface RiskCounts {
  low: number;
  medium: number;
  high: number;
  critical: number;
  anomalous: number;
}

export type ScanEventType =
  | "connecting"
  | "connected"
  | "check_update"
  | "finding"
  | "score"
  | "complete"
  | "error";

export interface ScanEvent {
  type: ScanEventType;
  payload: unknown;
}

export interface ScanSummary {
  id: string;
  target: string;
  mode: ScanTargetMode;
  status: "running" | "completed" | "failed";
  score?: ScoreBreakdown;
  risk?: RiskCounts;
  startedAt: string;
  completedAt?: string;
}

// Knowledge base document shown in the dynamic documentation panel.
export interface RuleDoc {
  ruleId: string;
  code: string; // SEC-HEADER-001 style human-readable code
  title: string;
  category: ScanCategory;
  whatWasDetected: string;
  whyItMatters: string;
  evidenceTemplate: string;
  defaultSeverity: Severity;
  howToFix: string;
  howToPrevent: string;
  howToVerify: string;
  references: { label: string; url: string }[];
}
