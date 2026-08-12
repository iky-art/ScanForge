export interface RawFinding {
  ruleId: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  evidence: Record<string, string>;
  anomalous?: boolean;
}

export interface CheckRunner {
  id: string;
  category: "security" | "web" | "performance" | "accessibility" | "seo";
  label: string;
}
