import { dashboardTokens } from "./dashboardTokens";
import type { PaymentDecision } from "../data/payments";

export type BadgeTone = "success" | "warning" | "danger" | "neutral";

export interface BadgeStyle {
  background: string;
  color: string;
}

export function toneStyle(tone: BadgeTone): BadgeStyle {
  switch (tone) {
    case "success":
      return { background: "rgba(74,138,104,0.16)", color: dashboardTokens.color.successText };
    case "warning":
      return { background: "rgba(217,151,59,0.18)", color: dashboardTokens.color.warningText };
    case "danger":
      return { background: "rgba(192,91,71,0.16)", color: dashboardTokens.color.dangerText };
    default:
      return { background: "rgba(86,66,86,0.10)", color: dashboardTokens.color.primary };
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

export function decisionTone(decision: PaymentDecision): BadgeTone {
  if (decision === "approved") return "success";
  if (decision === "blocked") return "danger";
  if (decision === "review_required") return "warning";
  return "neutral";
}

export function decisionStyle(decision: PaymentDecision) {
  return toneStyle(decisionTone(decision));
}

export function decisionLabel(decision: PaymentDecision) {
  const labels: Record<PaymentDecision, string> = {
    approved: "Approved",
    blocked: "Blocked",
    review_required: "Review Required",
    pending: "Pending",
  };
  return labels[decision];
}

export function auditActionStyle(action: string) {
  if (action.includes("Approved")) return toneStyle("success");
  if (action.includes("Rejected") || action.includes("Blocked")) return toneStyle("danger");
  if (action.includes("Updated") || action.includes("Created")) {
    return { background: "rgba(86,66,86,0.12)", color: dashboardTokens.color.primary };
  }
  return { background: "rgba(86,66,86,0.08)", color: dashboardTokens.color.secondaryText };
}

export function signedScore(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

