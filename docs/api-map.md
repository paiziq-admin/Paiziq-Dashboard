# Dashboard ↔ Backend API Map

Verified against the backend generated OpenAPI file at `files/paiziq/services/ingest/openapi.json` and the PZ-101 router at `files/paiziq/services/ingest/routers/reviews.py` on 2026-07-26. The broader narrative contract is `files/paiziq/docs/06_API_CONTRACT.md`; generated OpenAPI/router behavior is authoritative for current PZ-101 endpoint availability if narrative status text lags.

## Wire conventions

- Every request sends `Authorization: Bearer <key>`.
- Roles map to scopes as follows: `admin` = ingest/read/admin/review, `developer` = ingest/read, `reviewer` = read/review, and `read_only` = read.
- Successful control-plane responses and domain errors use `{"success", "data", "error": {"code", "message"} | null, "meta"?}`. Authentication/dependency and FastAPI schema-validation failures may use raw `{"detail": ...}` responses; the client normalizes both forms.
- `GET /v1/traces/{trace_id}` and `GET /v1/notifications` return raw ingest shapes.
- List endpoints use `limit`/`offset`; the maximum supported limit is 200 and control-plane lists return `meta.total`.
- Time fields and time-range parameters are integer epoch milliseconds.
- The client parses `Retry-After` on 429 and renders guidance; it does not automatically retry.
- A runtime 401 expires the dashboard session. A 403 preserves the session and renders a permission-denied state.
- Browser access requires the Vite origin in backend `PAIZIQ_CORS_ORIGINS`.

## Session and workspace

| Dashboard behavior | Request | Parameters used | Access |
| --- | --- | --- | --- |
| Verify login | `GET /v1/agents` | `limit=1` | any authenticated key |
| Load organizations | `GET /v1/orgs` | `limit=200`, increasing `offset` until `meta.total` is exhausted | any authenticated key |
| Load environments | `GET /v1/orgs/{org_id}/environments` | path `org_id`; `limit=200`, increasing `offset` until `meta.total` is exhausted | any authenticated key |

The login stores the normalized endpoint and API key in tab-scoped `sessionStorage`. Reloading that tab preserves the session; sign-out or tab close removes it. Session load/save/clear also deletes the legacy `paiziq.dashboard.session` value from `localStorage`. Because the agent probe uses the backend's generic authenticated-key dependency, successful login proves key validity but not read access to every dashboard resource. The workspace stores selected organization/environment and `24h`/`7d`/`30d` time range separately. The dashboard does not create organizations or environments.

## Overview and payments

| Screen behavior | Request | Exact query/body used |
| --- | --- | --- |
| Summary metrics | `GET /v1/metrics/summary` | `env_id`, `from_ms`, `to_ms` |
| Payment-volume series | `GET /v1/metrics/timeseries` | `env_id`, `metric=payments.total`, `interval`, `from_ms`, `to_ms`; interval is `1h` for 24h and `1d` otherwise |
| Recent payments | `GET /v1/payments` | `env_id`, `sort=created_desc`, `limit=8`, `offset=0` |
| Payment feed | `GET /v1/payments` | `env_id`; optional `agent_id`, `state`, `currency`, `min_amount`, `max_amount`, `q`; global `from_ms`/`to_ms`; `sort`; `limit`, `offset` |
| Feed agent names | `GET /v1/agents` | `env_id`, `limit=200`, `offset=0` |
| Payment detail | `GET /v1/payments/{payment_id}` | path `payment_id` |
| Execution evidence | `GET /v1/payments/{payment_id}/execution` | path `payment_id`; read role and payment environment enforced by service |
| Payment decisions | `GET /v1/decisions` | `payment_id`, `limit=200`, `offset=0` |
| Direct trace lookup | `GET /v1/traces/{trace_id}` | tries payment `request_id`, then payment ID |
| Trace correlation fallback | `GET /v1/search/events` | quoted `q`, `limit=10`, `offset=0`; returned trace IDs are fetched through `/v1/traces/{trace_id}` |
| Related webhook deliveries | `GET /v1/webhook-deliveries` | exact `env_id` + `payment_id`, `limit=200`, increasing `offset` until `meta.total` is exhausted |
| Delivery attempts | `GET /v1/webhook-deliveries/{delivery_id}` | every correlated delivery, loaded in concurrency batches of 20 |
| Manual payment transition | `POST /v1/payments/{payment_id}/transition` | `{"to": "approved" | "needs_review" | "rejected", "reason": string}`; the dashboard requires a reason |

All payment-feed filters and sorting are server-side. `sort` is one of `created_desc`, `created_asc`, `amount_desc`, `amount_asc`, or `merchant_asc`; currency and amount ranges are exact, time bounds are inclusive epoch milliseconds, and `q` searches the payment ID, agent ID, principal ID, merchant, request ID, and intent text. `meta.total` is the total after those filters, so page boundaries are exact. If a filter makes the requested page invalid, the dashboard clamps to the last page and refetches that offset. Saved views are browser-local. The feed refetches every 30 seconds in live mode.

The overview reads `payment_total` from the normalized summary payment-state counts and plots the summary's `risk_flags` map. It does not substitute verdict counts for risk flags.

The execution-evidence endpoint returns the service authority, a nullable execution claim, its reservation, exact decimal strings for rolling 24-hour/30-day committed spend, and all unresolved reservations scoped by organization, environment, agent, and currency. Immutable request/policy snapshots and digests freeze at the execution claim; events preserve the recorded actor and timestamp. The API returns up to the latest 1,000 events in chronological order, with `events_total`, `events_limit`, and `events_truncated`; the UI labels an incomplete window. Budget limits show the current policy, while the immutable snapshot preserves the execution policy. `confirmed` means the executor recorded a successful provider result. This read API does not independently contact the provider.

A 200 response with no claim is distinct from unavailable evidence. A legacy `executed` or `failed` payment without a claim is visibly unverified. A 404 does not prove no execution occurred; older servers may not support the endpoint. Unknown and in-progress results direct the operator to retain the original request and avoid a second charge. The dashboard has no execution, retry, reconciliation, or terminal-state mutation control. Refresh evidence repeats only the GET request. The evidence scope follows the payment, not the global time-range selector. The separate webhook section still reports delivery attempts; delivery success is not payment success.

Direct transitions require ingest or admin access. A payment in `needs_review` is deliberately resolved through the Reviews API instead of a detail-page transition.

Metrics, payments, decisions, search, and webhook-delivery reads require read access. Agent-name and direct-trace reads currently use the backend's generic authenticated-key dependency.

## Human reviews (PZ-101)

Native review reads require read access. Mutations require review or admin access.

| Workflow | Request | Exact query/body |
| --- | --- | --- |
| Open queue | `GET /v1/reviews` | `state=open`, optional `env_id`, `limit=200`, `offset=0` |
| Authenticated reviewer identity | `GET /v1/reviews/identity` | no query; returns `reviewer_id`, `role`, `env_id`, and `managed_identity` |
| Review detail | `GET /v1/reviews/{review_id}` | path `review_id` |
| Decision context by ID | `GET /v1/decisions/{decision_id}` | path `decision_id` |
| Decision context fallback | `GET /v1/decisions` | `payment_id`, `limit=200`, `offset=0` |
| Claim | `POST /v1/reviews/{review_id}/claim` | `{"reviewer_id": string}` |
| Release | `POST /v1/reviews/{review_id}/release` | `{"reviewer_id": string, "note"?: string}` |
| Reassign | `POST /v1/reviews/{review_id}/reassign` | `{"reviewer_id": target_reviewer, "note": string}` |
| Request information | `POST /v1/reviews/{review_id}/request-more-info` | `{"reviewer_id": acting_reviewer, "note": string}` |
| Escalate | `POST /v1/reviews/{review_id}/escalate` | `{"reviewer_id": acting_reviewer, "note": string, "priority": "high" | "urgent"}` |
| Approve | `POST /v1/reviews/{review_id}/approve` | `{"reviewer_id": acting_reviewer, "note": string}` |
| Decline | `POST /v1/reviews/{review_id}/decline` | `{"reviewer_id": acting_reviewer, "note": string}` |

The backend also retains `POST /v1/reviews/{review_id}/reject` as a compatibility alias; the dashboard uses `decline`.

Queue responses include the payment, priority, assignment, timestamps, `sla_deadline_ms`, `sla_remaining_ms`, and `sla_breached`. Search, owner/SLA/priority filters, and queue sorting are applied to the loaded queue.

For database-managed keys, the identity response binds review reads/actions to the key's environment and reports the key's name as `reviewer_id`. The dashboard locks that acting field. `claim`, `release`, request-info, escalation, approve, and decline bodies must use the same key name; developer/read-only roles cannot mutate. Reassignment's body names the target reviewer, while the authenticated key remains the recorded actor and non-admin callers must own the review. Bootstrap admins are unscoped and have no managed reviewer ID, so they enter an acting label; its browser storage is convenience metadata, not a credential.

Only a 404 from `GET /v1/reviews` enables older-server compatibility:

| Fallback | Request | Limitation |
| --- | --- | --- |
| Queue | `GET /v1/payments` with `env_id`, `state=needs_review`, `limit=200`, `offset=0` | Priority is `normal`; SLA is visibly estimated as 24 hours |
| Approve/decline | `POST /v1/payments/{payment_id}/transition` with `to` and required `reason` | Requires ingest/admin; no assignment, request-info, or escalation |

## Policies

Policy list/detail/version/diff/simulation requests require read access. Create, draft-save, publish, and rollback requests require admin access.

| Workflow | Request | Exact query/body |
| --- | --- | --- |
| List | `GET /v1/policies` | `env_id`, `limit=200`, `offset=0` |
| Detail | `GET /v1/policies/{policy_id}` | path `policy_id` |
| Create | `POST /v1/policies` | Dashboard sends `{"env_id": string, "name": string}` |
| Save draft | `PUT /v1/policies/{policy_id}/draft` | `{"document": policy document, "reason": nonblank audit reason}` |
| Publish | `POST /v1/policies/{policy_id}/publish` | no body |
| Roll back | `POST /v1/policies/{policy_id}/rollback` | `{"version": number}` |
| Version history | `GET /v1/policies/{policy_id}/versions` | path `policy_id` |
| Compare published versions | `GET /v1/policies/{policy_id}/versions/compare` | numeric `base` and `target`; the dashboard computes any comparison involving `draft` against its current in-browser document |
| Simulate | `POST /v1/policies/simulate` | hypothetical `payment` plus inline `document` for the current in-browser draft, or `policy_id` + `version` for a published version |

Allowlist and blocklist edits update the in-memory draft and are persisted by Save draft. The dashboard requires a nonblank reason; the backend records it in the `policy.draft_update` audit detail. Inline simulation is explicitly non-persisting and therefore includes unsaved browser edits. Likewise, any diff whose base or target is `draft` is computed locally from the current browser document; published-to-published comparison stays server-side. Publish is disabled while the browser draft is dirty; rollback publishes a new immutable version.

## Agents, API keys, audit, and alerts

| Screen behavior | Request | Exact query/body | Access |
| --- | --- | --- | --- |
| Agent inventory | `GET /v1/agents` | `env_id`, `limit=200`, `offset=0` | any authenticated key |
| Enable/disable agent | `PATCH /v1/agents/{agent_id}` | `{"status": "active" | "disabled"}` | any authenticated key (current backend dependency) |
| API-key inventory | `GET /v1/api-keys` | `env_id`, `limit=200`, `offset=0` | read |
| Create API key | `POST /v1/api-keys` | `env_id`, `name`, `scope`, and `role` | admin |
| Rotate API key | `POST /v1/api-keys/{key_id}/rotate` | `{"grace_seconds": 0 | 3600 | 86400 | 604800}` | admin |
| Revoke API key | `DELETE /v1/api-keys/{key_id}` | no body | admin |
| Audit page/export | `GET /v1/audit-logs` | optional exact `actor`, `action`, `resource`; optional `from_ms`, `to_ms`; `limit`, `offset` | read |
| Notification feed | `GET /v1/notifications` | none; raw `{notifications: [...]}` response | any authenticated key |
| Webhook-delivery feed | `GET /v1/webhook-deliveries` | selected `env_id`, `limit=200`, `offset=0` | read |

Audit CSV export walks matching pages with `limit=200` until the total is exhausted. API-key plaintext is accepted only from create/rotate responses and shown once. List responses retain only the prefix and lifecycle timestamps.

The Agents screen does not infer telemetry absent from the response. Alerts load each source independently: webhook deliveries are limited to the selected environment, while the legacy raw notification feed has no environment field or filter.

## Backend endpoints not exposed as dashboard workflows

The current backend also exposes capabilities that have no dashboard control:

- `POST /v1/orgs` and `POST /v1/orgs/{org_id}/environments`
- `GET/POST /v1/webhook-endpoints` and `PATCH /v1/webhook-endpoints/{endpoint_id}`
- `POST /v1/admin/retention/run`
- `POST /v1/agents`
- `POST /v1/payments`
- `POST /v1/decisions`
- `POST /v1/notifications`

Do not describe these as Settings features until a route actually wires the corresponding request and operator states.
