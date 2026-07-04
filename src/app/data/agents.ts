export type AgentStatus = "healthy" | "warning" | "error";

export interface AgentRow {
  name: string;
  environment: string;
  sdkVersion: string;
  lastEventReceived: string;
  errorRate: string;
  decisionLatency: string;
  webhookSuccessRate: string;
  status: AgentStatus;
}

export const agents: AgentRow[] = [
  { name: "checkout-service-prod", environment: "production", sdkVersion: "2.4.1", lastEventReceived: "2 minutes ago", errorRate: "0.02%", decisionLatency: "145ms", webhookSuccessRate: "99.8%", status: "healthy" },
  { name: "mobile-app-v3", environment: "production", sdkVersion: "2.3.8", lastEventReceived: "5 minutes ago", errorRate: "0.15%", decisionLatency: "178ms", webhookSuccessRate: "99.2%", status: "healthy" },
  { name: "web-checkout-v2", environment: "production", sdkVersion: "2.4.0", lastEventReceived: "8 minutes ago", errorRate: "0.08%", decisionLatency: "132ms", webhookSuccessRate: "99.9%", status: "healthy" },
  { name: "checkout-service-staging", environment: "staging", sdkVersion: "2.5.0-beta", lastEventReceived: "12 minutes ago", errorRate: "1.2%", decisionLatency: "245ms", webhookSuccessRate: "97.5%", status: "warning" },
];

export const sdkErrors = [
  { timestamp: "05-30 13:45:22", agent: "checkout-service-staging", type: "Timeout", message: "Decision endpoint timeout after 5000ms" },
  { timestamp: "05-30 12:18:45", agent: "mobile-app-v3", type: "Validation", message: "Invalid currency code: XYZ" },
  { timestamp: "05-30 11:32:11", agent: "web-checkout-v2", type: "Auth", message: "Invalid API key format" },
];

export const apiKeys = [
  { id: "prod", label: "Production Key", visible: "sk_prod_51Hx9mKq2vT8wLpN8472", masked: "sk_prod_************8472", created: "2026-05-10" },
  { id: "stag", label: "Staging Key", visible: "sk_test_82Jd4nRb7cY3qMzX2910", masked: "sk_test_************2910", created: "2026-04-28" },
];

