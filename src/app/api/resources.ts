// Typed endpoint functions (PZ-046). One thin wrapper per backend
// resource — paths and params mirror docs/api-map.md exactly.

import { apiFetch, type ApiResult } from "./client";
import type {
  Agent,
  ApiKey,
  AuditEntry,
  Decision,
  Environment,
  EventSearchItem,
  MetricsSummary,
  NotificationItem,
  Org,
  Payment,
  PaymentExecutionEvidence,
  Policy,
  PolicyDocument,
  PolicyVersion,
  SimulationResult,
  Trace,
  TimeseriesPoint,
  WebhookDelivery,
  WebhookDeliveryDetail,
} from "./types";

function query(params: Record<string, string | number | undefined>): string {
  const pairs = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!pairs.length) return "";
  return "?" + pairs.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ── tenancy ──────────────────────────────────────────────────────────
export const fetchOrgs = () =>
  fetchAllPages<Org>((limit, offset) => `/v1/orgs${query({ limit, offset })}`);
export const fetchEnvironments = (orgId: string) =>
  fetchAllPages<Environment>(
    (limit, offset) =>
      `/v1/orgs/${encodeURIComponent(orgId)}/environments${query({ limit, offset })}`,
  );

// ── metrics ──────────────────────────────────────────────────────────
export async function fetchMetricsSummary(p: {
  env_id: string;
  from_ms?: number;
  to_ms?: number;
}) {
  const result = await apiFetch<unknown>(`/v1/metrics/summary${query(p)}`);
  return { ...result, data: normalizeMetricsSummary(result.data, p.env_id) };
}

export async function fetchMetricsTimeseries(p: {
  env_id: string;
  metric: string;
  interval?: "1h" | "1d";
  from_ms?: number;
  to_ms?: number;
}) {
  const result = await apiFetch<unknown>(`/v1/metrics/timeseries${query(p)}`);
  const raw = Array.isArray(result.data)
    ? result.data
    : listValue(recordValue(result.data).points ?? recordValue(result.data).items);
  return { ...result, data: raw.map(normalizeTimeseriesPoint) };
}

// ── payments & decisions ─────────────────────────────────────────────
export const fetchPayments = (
  p: {
    env_id?: string;
    agent_id?: string;
    state?: string;
    currency?: string;
    min_amount?: number;
    max_amount?: number;
    q?: string;
    from_ms?: number;
    to_ms?: number;
    sort?: "created_desc" | "created_asc" | "amount_desc" | "amount_asc" | "merchant_asc";
    limit?: number;
    offset?: number;
  },
) => apiFetch<Payment[]>(`/v1/payments${query(p)}`);
export const fetchPayment = (id: string) => apiFetch<Payment>(`/v1/payments/${encodeURIComponent(id)}`);
export const fetchPaymentExecution = (id: string) =>
  apiFetch<PaymentExecutionEvidence>(`/v1/payments/${encodeURIComponent(id)}/execution`);
export const fetchDecisions = (p: { payment_id?: string; limit?: number; offset?: number }) =>
  apiFetch<Decision[]>(`/v1/decisions${query(p)}`);
export const transitionPayment = (
  id: string,
  body: { to: Exclude<Payment["state"], "proposed">; reason?: string },
) => apiFetch<Payment>(`/v1/payments/${encodeURIComponent(id)}/transition`, {
  method: "POST",
  body,
});

// ── traces & notifications (raw ingest-plane shapes) ─────────────────
export const fetchTrace = (traceId: string) =>
  apiFetch<Trace>(`/v1/traces/${encodeURIComponent(traceId)}`);
export const fetchNotifications = () =>
  apiFetch<{ notifications: NotificationItem[] }>("/v1/notifications");

// ── policies ─────────────────────────────────────────────────────────
export const fetchPolicies = (p: { env_id?: string; limit?: number; offset?: number }) =>
  apiFetch<Policy[]>(`/v1/policies${query(p)}`);
export const fetchPolicy = (id: string) => apiFetch<Policy>(`/v1/policies/${id}`);
export const createPolicy = (body: {
  env_id: string;
  name: string;
  document?: Partial<PolicyDocument>;
}) => apiFetch<Policy>("/v1/policies", { method: "POST", body });
export const updatePolicyDraft = (
  id: string,
  document: Partial<PolicyDocument>,
  reason?: string,
) =>
  apiFetch<Policy>(`/v1/policies/${id}/draft`, {
    method: "PUT",
    body: { document, ...(reason ? { reason } : {}) },
  });
export const publishPolicy = (id: string) =>
  apiFetch<PolicyVersion>(`/v1/policies/${id}/publish`, { method: "POST" });
export const rollbackPolicy = (id: string, version: number) =>
  apiFetch<PolicyVersion>(`/v1/policies/${id}/rollback`, { method: "POST", body: { version } });
export const fetchPolicyVersions = (id: string) =>
  apiFetch<PolicyVersion[]>(`/v1/policies/${id}/versions`);
export const comparePolicyVersions = (id: string, base: string, target: string) =>
  apiFetch<{
    policy_id: string;
    base: number | "draft";
    target: number | "draft";
    changes: Record<string, { base: unknown; target: unknown }>;
  }>(`/v1/policies/${id}/versions/compare${query({ base, target })}`);
export const simulatePolicy = (body: {
  payment: { merchant: string; amount: number; currency?: string; intent_description?: string };
  document?: Partial<PolicyDocument>;
  policy_id?: string;
  version?: number;
  use_draft?: boolean;
  env_id?: string;
}) => apiFetch<SimulationResult>("/v1/policies/simulate", { method: "POST", body });

// ── agents ───────────────────────────────────────────────────────────
export const fetchAgents = (p: { env_id?: string; limit?: number; offset?: number } = {}) =>
  apiFetch<Agent[]>(`/v1/agents${query(p)}`);
export const patchAgent = (
  id: string,
  body: { name?: string; status?: "active" | "disabled"; metadata?: Record<string, unknown> },
) => apiFetch<Agent>(`/v1/agents/${id}`, { method: "PATCH", body });

// ── api keys ─────────────────────────────────────────────────────────
export const fetchApiKeys = (p: { env_id?: string } = {}) =>
  apiFetch<ApiKey[]>(`/v1/api-keys${query(p)}`);
export const createApiKey = (body: {
  env_id: string;
  name: string;
  scope: "ingest" | "read" | "admin";
  role?: "admin" | "developer" | "reviewer" | "read_only";
}) => apiFetch<ApiKey>("/v1/api-keys", { method: "POST", body });
export const rotateApiKey = (id: string, graceSeconds = 0) =>
  apiFetch<ApiKey>(`/v1/api-keys/${id}/rotate`, {
    method: "POST",
    body: { grace_seconds: graceSeconds },
  });
export const revokeApiKey = (id: string) =>
  apiFetch<ApiKey>(`/v1/api-keys/${id}`, { method: "DELETE" });

// ── audit & search ───────────────────────────────────────────────────
export const fetchAuditLogs = (p: {
  actor?: string;
  action?: string;
  resource?: string;
  from_ms?: number;
  to_ms?: number;
  limit?: number;
  offset?: number;
}) => apiFetch<AuditEntry[]>(`/v1/audit-logs${query(p)}`);
export const searchEvents = (p: {
  q?: string;
  trace_id?: string;
  from_ms?: number;
  to_ms?: number;
  limit?: number;
  offset?: number;
}) => apiFetch<EventSearchItem[]>(`/v1/search/events${query(p)}`);

// ── webhooks ─────────────────────────────────────────────────────────
export const fetchWebhookDeliveries = (p: {
  state?: string;
  endpoint_id?: string;
  env_id?: string;
  event_type?: string;
  payment_id?: string;
  review_id?: string;
  limit?: number;
  offset?: number;
} = {}) =>
  apiFetch<WebhookDelivery[]>(`/v1/webhook-deliveries${query(p)}`);
export const fetchWebhookDelivery = (id: string) =>
  apiFetch<WebhookDeliveryDetail>(`/v1/webhook-deliveries/${encodeURIComponent(id)}`);

export type { ApiResult };

async function fetchAllPages<T>(
  pathForPage: (limit: number, offset: number) => string,
): Promise<ApiResult<T[]>> {
  const limit = 200;
  const data: T[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const page = await apiFetch<T[]>(pathForPage(limit, offset));
    data.push(...page.data);
    total = page.meta?.total ?? data.length;
    if (!page.data.length || page.data.length < limit || !page.meta) break;
    offset += page.data.length;
  }

  return {
    data,
    meta: {
      total: Number.isFinite(total) ? total : data.length,
      limit: data.length,
      offset: 0,
    },
  };
}

function numberValue(value: unknown, fallback = 0): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function listValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * The deployed endpoint returns grouped `decisions` and `payments`.
 * A few early builds returned flat counters; retaining that fallback lets
 * operators upgrade the dashboard before the service without fake data.
 */
function normalizeMetricsSummary(value: unknown, envId: string): MetricsSummary {
  const raw = recordValue(value);
  const decisions = recordValue(raw.decisions);
  const riskFlags = recordValue(raw.risk_flags);
  const payments = recordValue(raw.payments);
  const normalizedPayments = {
    proposed: numberValue(payments.proposed),
    approved: numberValue(payments.approved),
    needs_review: numberValue(payments.needs_review),
    rejected: numberValue(payments.rejected),
    executed: numberValue(payments.executed ?? raw.executed),
    failed: numberValue(payments.failed ?? raw.failed),
  };
  return {
    env_id: String(raw.env_id ?? envId),
    from_ms: numberValue(raw.from_ms),
    to_ms: numberValue(raw.to_ms),
    decisions: {
      approved: numberValue(decisions.approved ?? raw.approved),
      needs_review: numberValue(decisions.needs_review ?? raw.needs_review),
      rejected: numberValue(decisions.rejected ?? raw.rejected),
    },
    risk_flags: Object.fromEntries(
      Object.entries(riskFlags).map(([flag, count]) => [flag, numberValue(count)]),
    ),
    payments: normalizedPayments,
    open_reviews: numberValue(raw.open_reviews ?? raw.needs_review),
    webhook_deliveries: numberValue(raw.webhook_deliveries),
    webhook_delivered: numberValue(raw.webhook_delivered),
    webhook_success_rate:
      raw.webhook_success_rate == null
        ? null
        : numberValue(raw.webhook_success_rate),
    payment_total:
      Object.values(normalizedPayments).reduce((sum, item) => sum + item, 0) ||
      numberValue(raw.total),
  };
}

function normalizeTimeseriesPoint(value: unknown): TimeseriesPoint {
  const raw = recordValue(value);
  const firstNumericSeries = Object.entries(raw).find(
    ([key, item]) => key !== "bucket_ms" && Number.isFinite(Number(item)),
  );
  return {
    bucket_ms: numberValue(raw.bucket_ms),
    value: numberValue(raw.value ?? firstNumericSeries?.[1]),
  };
}
