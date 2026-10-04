import type { Payment, PaymentExecutionEvidence } from "../../app/api/types";

export const evidencePayment: Payment = {
  id: "pay_1", env_id: "env_1", agent_id: "agt_1", principal_id: "user-42",
  merchant: "Acme Cloud", amount: 20, currency: "USD", intent_description: "Renew hosting",
  state: "approved", request_id: "request_1", created_at_ms: 1_791_111_000_000, updated_at_ms: 1_791_111_000_000,
};

export function executionEvidence(status: NonNullable<PaymentExecutionEvidence["execution"]>["status"] = "unknown"): PaymentExecutionEvidence {
  return {
    payment_id: "pay_1", authority: "hosted", legacy_state: "approved", events_limit: 1000, events_total: 1, events_truncated: false,
    execution: {
      id: "execution_1", logical_action_id: "request_1", status, request_digest: "a".repeat(64), policy_digest: "b".repeat(64),
      policy_version: 1, decision_id: "decision_1", provider_idempotency_key: "paiziq-1", amount: "20.00000001", currency: "USD",
      created_at_ms: 1_791_111_000_000, updated_at_ms: 1_791_111_000_001, gateway_reference: status === "confirmed" ? "gateway_1" : null,
      error: status === "unknown" ? "Provider connection lost" : null,
    },
    reservation: { status: status === "confirmed" ? "committed" : status === "failed" ? "released" : "held", amount: "20.00000001", currency: "USD", expires_at_ms: null },
    budget: {
      scope: { org_id: "org_1", env_id: "env_1", agent_id: "agt_1" }, as_of_ms: 1_791_111_000_001,
      window: "rolling_24h", monthly_window: "rolling_30d", currency: "USD", committed_amount: "40.00000001", reserved_amount: "20.00000001",
      monthly_committed_amount: "60.00000001", monthly_reserved_amount: "20.00000001", daily_budget: "100", monthly_budget: "1000",
    },
    request_snapshot: { merchant: "Acme Cloud", amount: "20.00000001", currency: "USD", metadata: { api_key: "never-display-this-key" } },
    policy_snapshot: { daily_budget: "100", monthly_budget: "1000" },
    events: [{ id: "event_1", type: `execution_${status}`, at_ms: 1_791_111_000_001, actor: "key:executor", payload: { status, gateway_reference: null } }],
  };
}
