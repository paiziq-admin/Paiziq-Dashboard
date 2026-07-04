export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertItem {
  severity: AlertSeverity;
  title: string;
  description: string;
  meta: string;
}

export const alerts: AlertItem[] = [
  {
    severity: "critical",
    title: "Blocked payment spike - checkout-service-prod",
    description: "Blocked decisions up 340% in the last hour. 12 payments blocked, 8 share recipient merchant_8821.",
    meta: "14:05 UTC - rule: velocity_check",
  },
  {
    severity: "warning",
    title: "Review queue SLA at risk",
    description: "3 reviews approaching their 8h SLA deadline. Oldest has 32 minutes remaining.",
    meta: "13:48 UTC - queue: human_review",
  },
  {
    severity: "info",
    title: "Staging SDK error rate elevated",
    description: "checkout-service-staging error rate at 1.2% (threshold 1.0%). SDK 2.5.0-beta.",
    meta: "11:20 UTC - agent monitoring",
  },
];

