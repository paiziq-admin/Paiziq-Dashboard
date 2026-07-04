export type PaymentDecision = "approved" | "blocked" | "review_required" | "pending";
export type ReviewStatus = "assigned" | "in_progress" | "completed" | "pending";

export interface Payment {
  id: string;
  timestamp: string;
  agent: string;
  user: string;
  amount: number;
  currency: string;
  recipient: string;
  riskScore: number;
  decision: PaymentDecision;
  reviewStatus?: ReviewStatus;
  triggeredSignals: string[];
  environment: string;
}

export interface RiskSignal {
  name: string;
  value: number;
  description: string;
}

export interface TimelineEvent {
  event: string;
  details: string;
  time: string;
  state?: "done" | "pending" | "system";
}

export const payments: Payment[] = [
  {
    id: "PAY-2026-05-30-8472",
    timestamp: "2026-05-30T14:23:15Z",
    agent: "checkout-service-prod",
    user: "user_4728",
    amount: 12500,
    currency: "USD",
    recipient: "merchant_8821",
    riskScore: 72,
    decision: "blocked",
    reviewStatus: "completed",
    triggeredSignals: ["High amount", "New recipient", "Unusual time"],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8471",
    timestamp: "2026-05-30T14:19:42Z",
    agent: "mobile-app-v3",
    user: "user_3892",
    amount: 450,
    currency: "USD",
    recipient: "merchant_1204",
    riskScore: 48,
    decision: "review_required",
    reviewStatus: "assigned",
    triggeredSignals: ["Unusual user behavior", "New recipient"],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8470",
    timestamp: "2026-05-30T14:15:28Z",
    agent: "checkout-service-prod",
    user: "user_9201",
    amount: 89.99,
    currency: "USD",
    recipient: "merchant_5501",
    riskScore: 18,
    decision: "approved",
    reviewStatus: "completed",
    triggeredSignals: [],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8469",
    timestamp: "2026-05-30T14:12:03Z",
    agent: "web-checkout-v2",
    user: "user_5623",
    amount: 2200,
    currency: "EUR",
    recipient: "merchant_3304",
    riskScore: 55,
    decision: "review_required",
    reviewStatus: "in_progress",
    triggeredSignals: ["High amount", "Cross-border transaction"],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8468",
    timestamp: "2026-05-30T14:08:17Z",
    agent: "mobile-app-v3",
    user: "user_1047",
    amount: 125.5,
    currency: "USD",
    recipient: "merchant_1204",
    riskScore: 12,
    decision: "approved",
    reviewStatus: "completed",
    triggeredSignals: [],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8467",
    timestamp: "2026-05-30T14:03:45Z",
    agent: "checkout-service-staging",
    user: "test_user_42",
    amount: 999.99,
    currency: "USD",
    recipient: "test_merchant_01",
    riskScore: 5,
    decision: "approved",
    reviewStatus: "completed",
    triggeredSignals: [],
    environment: "staging",
  },
  {
    id: "PAY-2026-05-30-8466",
    timestamp: "2026-05-30T13:58:22Z",
    agent: "web-checkout-v2",
    user: "user_7734",
    amount: 8900,
    currency: "GBP",
    recipient: "merchant_9982",
    riskScore: 68,
    decision: "review_required",
    reviewStatus: "assigned",
    triggeredSignals: ["High amount", "New recipient", "Velocity check"],
    environment: "production",
  },
  {
    id: "PAY-2026-05-30-8465",
    timestamp: "2026-05-30T13:52:11Z",
    agent: "mobile-app-v3",
    user: "user_2910",
    amount: 34.99,
    currency: "USD",
    recipient: "merchant_5501",
    riskScore: 8,
    decision: "approved",
    reviewStatus: "completed",
    triggeredSignals: [],
    environment: "production",
  },
];

export const riskSignals: RiskSignal[] = [
  { name: "Amount risk", value: 20, description: "Payment amount exceeds typical user pattern" },
  { name: "New recipient", value: 15, description: "First time sending to this recipient" },
  { name: "Unusual user behavior", value: 25, description: "Login from new device/location" },
  { name: "Trusted merchant", value: -10, description: "Recipient has strong reputation" },
  { name: "Previous successful payments", value: -8, description: "User has positive history" },
];

export const timelineEvents: TimelineEvent[] = [
  { event: "SDK event received", details: "Payment request from mobile-app-v3", time: "14:19:42.123", state: "done" },
  { event: "Risk score calculated", details: "Score: 48 (Review Required)", time: "14:19:42.245", state: "done" },
  { event: "Policy evaluated", details: "Policy v2.3.1 applied", time: "14:19:42.298", state: "done" },
  { event: "Decision made", details: "Review Required", time: "14:19:42.312", state: "done" },
  { event: "Human review opened", details: "Assigned to review queue", time: "14:19:42.401", state: "done" },
  { event: "Reviewer action taken", details: "Pending - awaiting reviewer", time: "-", state: "pending" },
  { event: "Webhook delivered", details: "Status sent to agent - 200 OK", time: "14:19:42.567", state: "system" },
];

