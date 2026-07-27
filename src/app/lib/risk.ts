export type BadgeTone = "success" | "warning" | "danger" | "neutral";
export type DecisionStatus =
  | "approved"
  | "blocked"
  | "review_required"
  | "pending"
  | "proposed"
  | "needs_review"
  | "rejected"
  | "executed"
  | "failed";

export interface BadgeStyle {
  background: string;
  color: string;
}

export function toneStyle(tone: BadgeTone): BadgeStyle {
  switch (tone) {
    case "success":
      return { background: "rgba(74,138,104,0.16)", color: "var(--success-text)" };
    case "warning":
      return { background: "rgba(217,151,59,0.18)", color: "var(--warning-text)" };
    case "danger":
      return { background: "rgba(192,91,71,0.16)", color: "var(--danger-text)" };
    default:
      return { background: "rgba(86,66,86,0.10)", color: "var(--foreground)" };
  }
}

export function riskTone(score: number): BadgeTone {
  if (score < 40) return "success";
  if (score < 70) return "warning";
  return "danger";
}

export function riskStyle(score: number) {
  return toneStyle(riskTone(score));
}

export function decisionTone(decision: DecisionStatus): BadgeTone {
  if (decision === "approved" || decision === "executed") return "success";
  if (decision === "blocked" || decision === "rejected" || decision === "failed") return "danger";
  if (decision === "review_required" || decision === "needs_review") return "warning";
  return "neutral";
}

export function decisionStyle(decision: DecisionStatus) {
  return toneStyle(decisionTone(decision));
}

export function decisionLabel(decision: DecisionStatus) {
  const labels: Record<DecisionStatus, string> = {
    approved: "Approved",
    blocked: "Blocked",
    review_required: "Review Required",
    pending: "Pending",
    proposed: "Proposed",
    needs_review: "Needs Review",
    rejected: "Rejected",
    executed: "Executed",
    failed: "Failed",
  };
  return labels[decision];
}

export function auditActionStyle(action: string) {
  if (action.includes("Approved")) return toneStyle("success");
  if (action.includes("Rejected") || action.includes("Blocked")) return toneStyle("danger");
  if (action.includes("Updated") || action.includes("Created")) {
    return { background: "rgba(86,66,86,0.12)", color: "var(--foreground)" };
  }
  return { background: "rgba(86,66,86,0.08)", color: "var(--text-secondary)" };
}

export function signedScore(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
