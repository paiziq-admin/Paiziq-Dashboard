// Backend wire types (PZ-046). Mirrors services/ingest/openapi.json —
// see docs/api-map.md. Timestamps are epoch milliseconds.

export interface Envelope<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  meta?: { total: number; limit: number; offset: number };
}

export interface Org {
  id: string;
  name: string;
  created_at_ms: number;
}

export interface Environment {
  id: string;
  org_id: string;
  name: string;
  kind: "sandbox" | "production";
  created_at_ms: number;
}

export type PaymentState =
  | "proposed"
  | "approved"
  | "needs_review"
  | "rejected"
  | "executed"
  | "failed";

export interface PaymentTransition {
  from: string;
  to: string;
  actor: string;
  reason: string | null;
  at_ms: number;
}

export interface Payment {
  id: string;
  env_id: string;
  agent_id: string;
  principal_id: string;
  merchant: string;
  amount: number;
  currency: string;
  intent_description: string;
  state: PaymentState;
  request_id: string | null;
  created_at_ms: number;
  updated_at_ms: number;
  transitions?: PaymentTransition[];
}

/** Exact decimal amounts are strings: do not convert these ledger values to Number. */
export interface PaymentExecutionEvidence {
  payment_id: string;
  authority: "hosted";
  execution: {
    id: string;
    logical_action_id: string;
    status: "reserved" | "submitted" | "confirmed" | "failed" | "unknown";
    request_digest: string;
    policy_digest: string;
    policy_version: number | null;
    decision_id: string | null;
    provider_idempotency_key: string;
    amount: string;
    currency: string;
    created_at_ms: number;
    updated_at_ms: number;
    gateway_reference: string | null;
    error: string | null;
  } | null;
  reservation: {
    status: "held" | "committed" | "released";
    amount: string;
    currency: string;
    expires_at_ms: number | null;
  } | null;
  budget: {
    scope: { org_id: string; env_id: string; agent_id: string };
    as_of_ms: number;
    window: "rolling_24h";
    monthly_window: "rolling_30d";
    monthly_committed_amount: string;
    monthly_reserved_amount: string;
    currency: string;
    committed_amount: string;
    reserved_amount: string;
    daily_budget: string | null;
    monthly_budget: string | null;
  };
  request_snapshot: Record<string, unknown> | null;
  policy_snapshot: Record<string, unknown> | null;
  events: Array<{
    id: string;
    type: string;
    at_ms: number;
    actor: string;
    payload: Record<string, unknown>;
  }>;
  legacy_state: string;
  events_limit: number;
  events_total: number;
  events_truncated: boolean;
}

export interface Decision {
  id: string;
  payment_id: string;
  policy_version: number | null;
  verdict: "approved" | "needs_review" | "rejected";
  reasons: string[];
  risk_flags: string[];
  created_at_ms: number;
  review_id?: string | null;
}

export interface PolicyDocument {
  merchant_allowlist: string[] | null;
  merchant_blocklist: string[];
  known_merchants: string[];
  review_categories: string[];
  allowed_currencies: string[];
  review_threshold: number;
  hard_limit: number;
  treat_unknown_merchant_as: string;
  daily_budget: number | null;
  monthly_budget: number | null;
  budget_warning_ratio: number;
  max_tx_per_hour: number | null;
}

export interface Policy {
  id: string;
  env_id: string;
  name: string;
  draft_document: PolicyDocument | null;
  active_version: number | null;
  latest_version: number | null;
  created_at_ms: number;
}

export interface PolicyVersion {
  policy_id: string;
  version: number;
  document: PolicyDocument;
  is_active: boolean;
  published_at_ms: number;
}

export interface SimulationResult {
  verdict: "approved" | "needs_review" | "rejected";
  reasons: string[];
  risk_flags: string[];
  policy_source: { type: string; policy_id?: string; version?: number };
  persisted: false;
}

export interface Agent {
  id: string;
  env_id: string;
  name: string;
  framework: string | null;
  status: "active" | "disabled";
  metadata: Record<string, unknown>;
  created_at_ms: number;
}

export interface ApiKey {
  id: string;
  env_id: string;
  name: string;
  scope: "ingest" | "read" | "admin";
  role?: "admin" | "developer" | "reviewer" | "read_only" | null;
  secret_prefix: string;
  secret?: string; // present exactly once, on create/rotate responses
  created_at_ms: number;
  rotated_at_ms: number | null;
  revoked_at_ms: number | null;
  grace_until_ms: number | null;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  detail: Record<string, unknown>;
  at_ms: number;
}

export interface MetricsSummary {
  env_id: string;
  from_ms: number;
  to_ms: number;
  decisions: Partial<Record<Decision["verdict"], number>>;
  risk_flags: Record<string, number>;
  payments: Partial<Record<PaymentState, number>>;
  open_reviews: number;
  webhook_deliveries: number;
  webhook_delivered: number;
  webhook_success_rate: number | null;
  payment_total: number;
}

export interface TimeseriesPoint {
  bucket_ms: number;
  value: number;
}

export interface NotificationItem {
  severity: string;
  title: string;
  message: string;
  request_id: string | null;
  risk_flags: string[];
  created_at_ms: number | null;
}

export interface Span {
  name: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  start_ms: number | null;
  end_ms: number | null;
  duration_ms: number | null;
  status: string;
  attributes: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
}

export interface Trace {
  trace_id: string;
  spans: Span[];
}

export interface EventSearchItem {
  trace_id: string;
  span_id: string;
  name: string;
  kind: string;
  payload: Record<string, unknown>;
  at_ms: number | null;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  state: "pending" | "delivered" | "dead";
  attempts: number;
  next_attempt_ms: number;
  last_error: string | null;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface WebhookDeliveryLog {
  attempt: number;
  status_code: number | null;
  error: string | null;
  at_ms: number;
}

export interface WebhookDeliveryDetail extends WebhookDelivery {
  logs: WebhookDeliveryLog[];
}
