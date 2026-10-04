import { apiFetch } from "./client";
import type {
  Agent,
  ApiKey,
  AuditEntry,
  NotificationItem,
  Policy,
  WebhookDelivery,
} from "./types";

function query(params: Record<string, string | number | undefined>): string {
  const pairs = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  return pairs.length
    ? `?${pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&")}`
    : "";
}

export type PageParams = {
  limit?: number;
  offset?: number;
};

export type AuditFilters = PageParams & {
  actor?: string;
  action?: string;
  resource?: string;
  from_ms?: number;
  to_ms?: number;
};

export interface WebhookDeliveryDetail extends WebhookDelivery {
  payload: Record<string, unknown>;
}

export function fetchPolicyPage(params: PageParams & { env_id?: string } = {}) {
  return apiFetch<Policy[]>(`/v1/policies${query(params)}`);
}

export function fetchAgentPage(params: PageParams & { env_id?: string } = {}) {
  return apiFetch<Agent[]>(`/v1/agents${query(params)}`);
}

export function fetchApiKeyPage(params: PageParams & { env_id?: string } = {}) {
  return apiFetch<ApiKey[]>(`/v1/api-keys${query(params)}`);
}

export function fetchAuditPage(params: AuditFilters = {}) {
  return apiFetch<AuditEntry[]>(`/v1/audit-logs${query(params)}`);
}

export function fetchWebhookDeliveryPage(
  params: PageParams & {
    state?: string;
    endpoint_id?: string;
    env_id?: string;
    event_type?: string;
    payment_id?: string;
    review_id?: string;
  } = {},
) {
  return apiFetch<WebhookDeliveryDetail[]>(`/v1/webhook-deliveries${query(params)}`);
}

export function fetchNotificationFeed() {
  return apiFetch<{ notifications: NotificationItem[] }>("/v1/notifications");
}
