import type { Page, Route } from "@playwright/test";

const now = 1_785_000_000_000;

const defaultPolicyDocument = {
  merchant_allowlist: null,
  merchant_blocklist: ["blocked.example"],
  known_merchants: ["Acme Cloud"],
  review_categories: ["gift_cards"],
  allowed_currencies: ["USD"],
  review_threshold: 100,
  hard_limit: 1_000,
  treat_unknown_merchant_as: "needs_review",
  daily_budget: 5_000,
  monthly_budget: 50_000,
  budget_warning_ratio: 0.8,
  max_tx_per_hour: 20,
};

export async function installMockApi(page: Page) {
  const agent = {
    id: "agt_1",
    env_id: "env_1",
    name: "procurement-agent",
    framework: "openai",
    status: "active",
    metadata: { owner: "payments" },
    created_at_ms: now - 86_400_000,
  };
  const payment = {
    id: "pay_1",
    env_id: "env_1",
    agent_id: "agt_1",
    principal_id: "user-42",
    merchant: "Acme Cloud",
    amount: 249.99,
    currency: "USD",
    intent_description: "Renew the annual cloud subscription",
    state: "needs_review",
    request_id: "trace_1",
    created_at_ms: now - 7_200_000,
    updated_at_ms: now - 3_600_000,
    transitions: [
      {
        from: "proposed",
        to: "needs_review",
        actor: "key:test",
        reason: "decision dec_1",
        at_ms: now - 3_600_000,
      },
    ],
  };
  const decision = {
    id: "dec_1",
    payment_id: "pay_1",
    policy_version: 1,
    verdict: "needs_review",
    reasons: ["Amount exceeds the review threshold"],
    risk_flags: ["over_review_threshold"],
    created_at_ms: now - 3_600_000,
    review_id: "rev_1",
  };
  let review = {
    id: "rev_1",
    payment_id: "pay_1",
    decision_id: "dec_1",
    state: "open",
    reviewer_id: null as string | null,
    note: null as string | null,
    created_at_ms: now - 3_600_000,
    resolved_at_ms: null as number | null,
    sla_deadline_ms: now + 20_000_000,
    priority: "normal",
    last_action: "opened",
    assigned_at_ms: null as number | null,
    updated_at_ms: now - 3_600_000,
    sla_remaining_ms: 20_000_000,
    sla_breached: false,
    payment,
  };
  let draft = structuredClone(defaultPolicyDocument);
  let policy = {
    id: "pol_1",
    env_id: "env_1",
    name: "Default payment policy",
    draft_document: draft,
    active_version: 1,
    latest_version: 1,
    created_at_ms: now - 172_800_000,
  };
  let versions = [
    {
      policy_id: "pol_1",
      version: 1,
      document: structuredClone(defaultPolicyDocument),
      is_active: true,
      published_at_ms: now - 86_400_000,
    },
  ];
  let keys: Array<{
    id: string;
    env_id: string;
    name: string;
    scope: string;
    role: string;
    secret_prefix: string;
    secret?: string;
    created_at_ms: number;
    rotated_at_ms: number | null;
    revoked_at_ms: number | null;
    grace_until_ms: number | null;
  }> = [
    {
      id: "key_1",
      env_id: "env_1",
      name: "Dashboard read key",
      scope: "read",
      role: "read_only",
      secret_prefix: "pzq_sand_abc",
      created_at_ms: now - 86_400_000,
      rotated_at_ms: null,
      revoked_at_ms: null,
      grace_until_ms: null,
    },
  ];

  await page.route("http://api.paiziq.test/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const postData = request.postData();
    const body = postData
      ? JSON.parse(postData) as Record<string, unknown>
      : null;

    if (method === "GET" && path === "/v1/orgs") {
      return envelope(route, [
        { id: "org_1", name: "Acme", created_at_ms: now - 200_000_000 },
      ]);
    }
    if (method === "GET" && path === "/v1/orgs/org_1/environments") {
      return envelope(route, [
        {
          id: "env_1",
          org_id: "org_1",
          name: "Sandbox",
          kind: "sandbox",
          created_at_ms: now - 190_000_000,
        },
      ]);
    }
    if (path === "/v1/agents" && method === "GET") {
      return envelope(route, [agent], { total: 1, limit: 200, offset: 0 });
    }
    if (path === "/v1/agents/agt_1" && method === "PATCH") {
      Object.assign(agent, body);
      return envelope(route, agent);
    }
    if (path === "/v1/metrics/summary") {
      return envelope(route, {
        env_id: "env_1",
        from_ms: now - 86_400_000,
        to_ms: now,
        decisions: { approved: 8, needs_review: 1, rejected: 1 },
        payments: {
          proposed: 0,
          approved: 4,
          needs_review: 1,
          rejected: 1,
          executed: 4,
          failed: 0,
        },
        open_reviews: review.state === "open" ? 1 : 0,
        webhook_deliveries: 10,
        webhook_delivered: 9,
        webhook_success_rate: 0.9,
      });
    }
    if (path === "/v1/metrics/timeseries") {
      return envelope(route, [
        { bucket_ms: now - 7_200_000, value: 3 },
        { bucket_ms: now - 3_600_000, value: 6 },
        { bucket_ms: now, value: 4 },
      ]);
    }
    if (path === "/v1/payments" && method === "GET") {
      const items =
        url.searchParams.get("state") === "needs_review" && payment.state !== "needs_review"
          ? []
          : [payment];
      return envelope(route, items, {
        total: items.length,
        limit: Number(url.searchParams.get("limit") ?? 50),
        offset: Number(url.searchParams.get("offset") ?? 0),
      });
    }
    if (path === "/v1/payments/pay_1" && method === "GET") {
      return envelope(route, payment);
    }
    if (path === "/v1/payments/pay_1/transition" && method === "POST") {
      payment.state = String(body?.to);
      payment.updated_at_ms = now;
      return envelope(route, payment);
    }
    if (path === "/v1/decisions" && method === "GET") {
      return envelope(route, [decision], { total: 1, limit: 50, offset: 0 });
    }
    if (path === "/v1/decisions/dec_1" && method === "GET") {
      return envelope(route, decision);
    }
    if (path === "/v1/reviews" && method === "GET") {
      const items = review.state === "open" ? [review] : [];
      return envelope(route, items, { total: items.length, limit: 200, offset: 0 });
    }
    if (path === "/v1/reviews/identity" && method === "GET") {
      return envelope(route, {
        reviewer_id: "alice@example.com",
        role: "reviewer",
        env_id: "env_1",
        managed_identity: true,
      });
    }
    if (path === "/v1/reviews/rev_1" && method === "GET") {
      return envelope(route, review);
    }
    if (path.startsWith("/v1/reviews/rev_1/") && method === "POST") {
      const action = path.split("/").at(-1);
      const reviewerId = String(body?.reviewer_id ?? "");
      if (action === "claim") {
        review = {
          ...review,
          reviewer_id: reviewerId,
          assigned_at_ms: now,
          updated_at_ms: now,
          last_action: "claimed",
        };
      } else if (action === "release") {
        review = {
          ...review,
          reviewer_id: null,
          assigned_at_ms: null,
          updated_at_ms: now,
          last_action: "released",
        };
      } else if (action === "reassign") {
        review = {
          ...review,
          reviewer_id: reviewerId,
          note: String(body?.note ?? ""),
          assigned_at_ms: now,
          updated_at_ms: now,
          last_action: "reassigned",
        };
      } else if (action === "request-more-info") {
        review = {
          ...review,
          reviewer_id: reviewerId,
          note: String(body?.note ?? ""),
          updated_at_ms: now,
          last_action: "requested_info",
        };
      } else if (action === "escalate") {
        review = {
          ...review,
          reviewer_id: reviewerId,
          note: String(body?.note ?? ""),
          priority: String(body?.priority ?? "urgent"),
          updated_at_ms: now,
          last_action: "escalated",
        };
      } else if (action === "approve" || action === "decline") {
        const approved = action === "approve";
        payment.state = approved ? "approved" : "rejected";
        review = {
          ...review,
          reviewer_id: reviewerId,
          note: String(body?.note ?? ""),
          state: approved ? "approved" : "rejected",
          resolved_at_ms: now,
          updated_at_ms: now,
          last_action: approved ? "approved" : "rejected",
        };
      }
      return envelope(route, review);
    }
    if (path === "/v1/policies" && method === "GET") {
      return envelope(route, [policy], { total: 1, limit: 200, offset: 0 });
    }
    if (path === "/v1/policies" && method === "POST") {
      return envelope(route, policy);
    }
    if (path === "/v1/policies/pol_1" && method === "GET") {
      return envelope(route, policy);
    }
    if (path === "/v1/policies/pol_1/versions" && method === "GET") {
      return envelope(route, versions);
    }
    if (path === "/v1/policies/pol_1/versions/compare" && method === "GET") {
      return envelope(route, {
        policy_id: "pol_1",
        base: 1,
        target: "draft",
        changes: {
          review_threshold: {
            base: defaultPolicyDocument.review_threshold,
            target: draft.review_threshold,
          },
        },
      });
    }
    if (path === "/v1/policies/pol_1/draft" && method === "PUT") {
      draft = structuredClone(body?.document as typeof defaultPolicyDocument);
      policy = { ...policy, draft_document: draft };
      return envelope(route, policy);
    }
    if (path === "/v1/policies/pol_1/publish" && method === "POST") {
      versions = versions.map((version) => ({ ...version, is_active: false }));
      const published = {
        policy_id: "pol_1",
        version: versions.length + 1,
        document: structuredClone(draft),
        is_active: true,
        published_at_ms: now,
      };
      versions.push(published);
      policy = {
        ...policy,
        active_version: published.version,
        latest_version: published.version,
      };
      return envelope(route, published);
    }
    if (path === "/v1/policies/pol_1/rollback" && method === "POST") {
      return envelope(route, versions[0]);
    }
    if (path === "/v1/policies/simulate" && method === "POST") {
      return envelope(route, {
        verdict: "needs_review",
        reasons: ["Amount exceeds the review threshold"],
        risk_flags: ["over_review_threshold"],
        policy_source: { type: "draft", policy_id: "pol_1" },
        persisted: false,
      });
    }
    if (path === "/v1/api-keys" && method === "GET") {
      return envelope(route, keys, { total: keys.length, limit: 50, offset: 0 });
    }
    if (path === "/v1/api-keys" && method === "POST") {
      const created = {
        id: "key_2",
        env_id: "env_1",
        name: String(body?.name ?? "New key"),
        scope: String(body?.scope ?? "read"),
        role: String(body?.role ?? "read_only"),
        secret_prefix: "pzq_sand_new",
        secret: "pzq_sand_one_time_secret",
        created_at_ms: now,
        rotated_at_ms: null,
        revoked_at_ms: null,
        grace_until_ms: null,
      };
      keys = [...keys, created];
      return envelope(route, created);
    }
    if (path === "/v1/api-keys/key_1/rotate" && method === "POST") {
      return envelope(route, { ...keys[0], secret: "pzq_sand_rotated_secret" });
    }
    if (path === "/v1/api-keys/key_1" && method === "DELETE") {
      keys = keys.map((key) =>
        key.id === "key_1" ? { ...key, revoked_at_ms: now } : key,
      );
      return envelope(route, keys[0]);
    }
    if (path === "/v1/audit-logs" && method === "GET") {
      return envelope(
        route,
        [
          {
            id: "aud_1",
            actor: "key:test",
            action: "review.approved",
            resource: "rev_1",
            detail: { note: "Verified" },
            at_ms: now,
          },
        ],
        { total: 1, limit: 50, offset: 0 },
      );
    }
    if (path === "/v1/webhook-deliveries" && method === "GET") {
      return envelope(
        route,
        [
          {
            id: "whd_1",
            endpoint_id: "whe_1",
            event_type: "review.assigned",
            payload: { data: { review_id: "rev_1" } },
            state: "delivered",
            attempts: 1,
            next_attempt_ms: now,
            last_error: null,
            created_at_ms: now - 2_000,
            updated_at_ms: now - 1_000,
          },
        ],
        { total: 1, limit: 200, offset: 0 },
      );
    }
    if (path === "/v1/webhook-deliveries/whd_1" && method === "GET") {
      return envelope(route, {
        id: "whd_1",
        endpoint_id: "whe_1",
        event_type: "review.assigned",
        payload: { data: { review_id: "rev_1" } },
        state: "delivered",
        attempts: 1,
        next_attempt_ms: now,
        last_error: null,
        created_at_ms: now - 2_000,
        updated_at_ms: now - 1_000,
        logs: [],
      });
    }
    if (path === "/v1/notifications" && method === "GET") {
      return raw(route, {
        notifications: [
          {
            severity: "warning",
            title: "Payment needs review",
            message: "Acme Cloud renewal",
            request_id: "trace_1",
            risk_flags: ["over_review_threshold"],
            created_at_ms: now,
          },
        ],
      });
    }
    if (path === "/v1/traces/trace_1" && method === "GET") {
      return raw(route, {
        trace_id: "trace_1",
        spans: [
          {
            name: "paiziq.review_payment",
            trace_id: "trace_1",
            span_id: "span_1",
            parent_span_id: null,
            start_ms: now - 4_000,
            end_ms: now - 3_000,
            duration_ms: 1_000,
            status: "ok",
            attributes: { "paiziq.decision": "needs_review" },
            events: [],
          },
        ],
      });
    }
    if (path === "/v1/search/events" && method === "GET") {
      return envelope(route, [], { total: 0, limit: 50, offset: 0 });
    }

    return errorEnvelope(route, 404, "not_found", `No E2E mock for ${method} ${path}`);
  });
}

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Backend URL").fill("http://api.paiziq.test");
  await page.getByLabel("API key").fill("test-key");
  await page.getByRole("button", { name: "Connect dashboard" }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();
}

async function envelope(
  route: Route,
  data: unknown,
  meta?: { total: number; limit: number; offset: number },
) {
  return raw(route, {
    success: true,
    data,
    error: null,
    ...(meta ? { meta } : {}),
  });
}

async function errorEnvelope(
  route: Route,
  status: number,
  code: string,
  message: string,
) {
  return route.fulfill({
    body: JSON.stringify({
      success: false,
      data: null,
      error: { code, message },
    }),
    contentType: "application/json",
    status,
  });
}

async function raw(route: Route, data: unknown) {
  return route.fulfill({
    body: JSON.stringify(data),
    contentType: "application/json",
    status: 200,
  });
}
