import type { Page, Route } from "@playwright/test";

const now = Date.now();

export const policyDocument = {
  merchant_allowlist: null as string[] | null,
  merchant_blocklist: ["shady llc"],
  known_merchants: ["acme corp", "cloudhost inc", "shady llc"],
  review_categories: [] as string[],
  allowed_currencies: ["USD"],
  review_threshold: 100,
  hard_limit: 1_000,
  treat_unknown_merchant_as: "needs_review",
  daily_budget: 5_000,
  monthly_budget: null as number | null,
  budget_warning_ratio: 0.8,
  max_tx_per_hour: 20,
};

const thresholdReason =
  "Amount 180.00 exceeds review threshold 100.00; human approval required";

export const payments = {
  t2: {
    id: "pay_t2",
    env_id: "env_1",
    agent_id: "agt_e2e",
    principal_id: "user-42",
    merchant: "cloudhost inc",
    amount: 180,
    currency: "USD",
    intent_description: "Annual CloudHost renewal",
    state: "needs_review",
    request_id: "e2e-req-t2-review",
    created_at_ms: now - 3_600_000,
    updated_at_ms: now - 1_800_000,
    transitions: [
      { from: "proposed", to: "needs_review", actor: "key:test", reason: "decision", at_ms: now - 1_800_000 },
    ],
  },
};

const allPayments = [
  { ...payments.t2, id: "pay_t1", merchant: "acme corp", amount: 49.99, state: "executed", request_id: "e2e-req-t1-approved" },
  payments.t2,
  { ...payments.t2, id: "pay_t3", merchant: "shady llc", amount: 20, state: "rejected", request_id: "e2e-req-t3-rejected" },
];

function evaluate(merchant: string, amount: number, threshold: number) {
  if (merchant.trim().toLowerCase() === "shady llc") {
    return {
      verdict: "rejected",
      reasons: [`Merchant '${merchant}' is blocklisted`],
      risk_flags: ["merchant_blocked"],
    };
  }
  if (amount > threshold) {
    return { verdict: "needs_review", reasons: [`Amount ${amount.toFixed(2)} exceeds review threshold ${threshold.toFixed(2)}; human approval required`], risk_flags: ["over_review_threshold"] };
  }
  return { verdict: "approved", reasons: ["All decision rules passed"], risk_flags: [] as string[] };
}

async function envelope(route: Route, data: unknown, total = 1) {
  await route.fulfill({
    json: { success: true, data, error: null, meta: { total, limit: 200, offset: 0 } },
  });
}

export async function installPaymentAgentFixtures(page: Page) {
  await page.route("http://api.paiziq.test/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const raw = route.request().postData();
    const body = raw ? JSON.parse(raw) as Record<string, unknown> : null;
    if (path === "/v1/orgs" && method === "GET") {
      return envelope(route, [{ id: "org_1", name: "E2E Org", created_at_ms: now }]);
    }
    if (path === "/v1/orgs/org_1/environments") {
      return envelope(route, [{ id: "env_1", org_id: "org_1", name: "e2e-sandbox", kind: "sandbox", created_at_ms: now }]);
    }
    if (path === "/v1/agents") {
      return envelope(route, [{ id: "agt_e2e", env_id: "env_1", name: "e2e-payment-agent", framework: "custom", status: "active", metadata: {}, created_at_ms: now }]);
    }
    if (path === "/v1/metrics/summary") {
      return envelope(route, { env_id: "env_1", from_ms: now, to_ms: now, decisions: {}, risk_flags: {}, payments: { needs_review: 1 }, open_reviews: 1, webhook_deliveries: 0, webhook_delivered: 0, webhook_success_rate: null });
    }
    if (path === "/v1/metrics/timeseries") return envelope(route, [{ bucket_ms: now, value: 3 }]);
    if (path === "/v1/payments" && method === "GET") return envelope(route, allPayments, 3);
    if (path === "/v1/payments/pay_t2") return envelope(route, payments.t2);
    if (path === "/v1/decisions") {
      return envelope(route, [{ id: "dec_t2", payment_id: "pay_t2", policy_version: 1, verdict: "needs_review", reasons: [thresholdReason], risk_flags: ["over_review_threshold"], created_at_ms: now, review_id: "rev_t2" }]);
    }
    if (path === "/v1/traces/e2e-req-t2-review") {
      return route.fulfill({ json: { trace_id: "e2e-req-t2-review", spans: [{ name: "paiziq.review_payment", trace_id: "e2e-req-t2-review", span_id: "span_t2", parent_span_id: null, start_ms: now, end_ms: now, duration_ms: 4, status: "ok", attributes: {}, events: [{ name: "decision", ts_ms: now, payload: { request_id: payments.t2.request_id, status: "needs_review", reasons: [thresholdReason], risk_flags: ["over_review_threshold"] } }] }] } });
    }
    if (path === "/v1/search/events" || path === "/v1/webhook-deliveries" || path === "/v1/audit-logs" || path === "/v1/api-keys") {
      return envelope(route, [], 0);
    }
    if (path === "/v1/notifications") return route.fulfill({ json: { notifications: [] } });
    if (path === "/v1/reviews/identity") {
      return envelope(route, { reviewer_id: null, role: "admin", env_id: null, managed_identity: false });
    }
    if (path === "/v1/reviews") {
      return envelope(route, [{ id: "rev_t2", payment_id: "pay_t2", decision_id: "dec_t2", state: "open", reviewer_id: null, note: null, created_at_ms: now, resolved_at_ms: null, sla_deadline_ms: now, priority: "normal", last_action: "opened", assigned_at_ms: null, updated_at_ms: now, sla_remaining_ms: 1000, sla_breached: false, payment: payments.t2 }]);
    }
    if (path === "/v1/policies" || path === "/v1/policies/pol_e2e") {
      return envelope(route, path.endsWith("pol_e2e")
        ? { id: "pol_e2e", env_id: "env_1", name: "e2e-threshold-policy", draft_document: policyDocument, active_version: 1, latest_version: 1, created_at_ms: now }
        : [{ id: "pol_e2e", env_id: "env_1", name: "e2e-threshold-policy", draft_document: policyDocument, active_version: 1, latest_version: 1, created_at_ms: now }]);
    }
    if (path === "/v1/policies/pol_e2e/versions") {
      return envelope(route, [{ policy_id: "pol_e2e", version: 1, document: policyDocument, is_active: true, published_at_ms: now }]);
    }
    if (path === "/v1/policies/simulate" && method === "POST") {
      const paymentBody = (body?.payment ?? {}) as { merchant?: string; amount?: number };
      const result = evaluate(String(paymentBody.merchant ?? ""), Number(paymentBody.amount ?? 0), Number((body?.document as typeof policyDocument)?.review_threshold ?? 100));
      return envelope(route, { ...result, policy_source: { type: "inline" }, persisted: false });
    }
    return route.fulfill({ status: 404, json: { success: false, data: null, error: { code: "not_found", message: `${method} ${path}` } } });
  });
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Backend URL").fill("http://api.paiziq.test");
  await page.getByLabel("API key").fill("test-key");
  await page.getByRole("button", { name: "Connect dashboard" }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();
}
