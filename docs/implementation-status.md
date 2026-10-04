# Dashboard Implementation Status

Phase 0 execution evidence verified against the active dashboard and local hosted service on 2026-10-04. The earlier PZ-101 inventory was verified on 2026-07-26. “Configured” means the repository contains the command/workflow configuration; it is not a claim that the gate passed in every environment.

## Phase 0 tracker — execution and evidence foundation

Scope: the execution foundation from the site-artifact parity plan. Scores, economic recommendations, compute usage, and outcomes belong to later phases.

| ID | Owner | Status | To-do / acceptance evidence |
| --- | --- | --- | --- |
| P0-FE-01 | Frontend | Complete | Read `/v1/payments/{payment_id}/execution` through the authenticated API layer; preserve exact decimal strings. |
| P0-FE-02 | Frontend | Complete | Show reserved, in-progress, confirmed, failed, and unknown states; do not infer a charge from approval or a legacy report. |
| P0-FE-03 | Frontend | Complete | Show organization/environment/agent/currency scope, rolling spend, all unresolved reservations, immutable authorization snapshots and append-only event history. |
| P0-FE-04 | Frontend | Complete | Remove manual terminal-state buttons. Unknown results direct the operator to reconcile the provider request before retry. |
| P0-FE-05 | Frontend | Complete | Preserve read-only access, demo mode, loading, missing evidence, older-server 404, 403, 429, refresh, and stale-response isolation; redact evidence JSON. |
| P0-FE-06 | Frontend | Complete | `npm run check`: 24 unit/API/component tests plus lint, typecheck, build, and docs; `npm run test:e2e`: 8 browser workflows; `npm run test:e2e:service`: 2 live-service workflows. |
| P0-BE-01 | Backend | See backend tracker | Shared exact ledger, atomic reservations and execution claims, immutable snapshots, provider idempotency/reconciliation, hosted/local authority, and durable business events. [Backend progress tracker](../../paiziq_backend/files/paiziq/docs/05_PROGRESS_TRACKER.md) records backend completion evidence. |

The live service workflow uses a new isolated SQLite database and mock providers. The SDK submits a confirmed request twice with one provider call, retains an unknown request with one provider call and 20 USD reserved, and blocks a new 50 USD request because 40 USD committed plus 20 USD reserved would exceed the 100 USD limit. [Captured execution evidence](phase0-evidence/phase0-unknown-execution.png) and [run report](phase0-evidence/phase0-workflow.json) record the local browser run. The screenshots and viewport assertions cover desktop, tablet, and 320/390px phones in light and dark themes.

## Backlog coverage

| Task | Status | Implemented behavior |
| --- | --- | --- |
| PZ-046 | Implemented | Authenticated API client, envelope/raw-shape handling, typed resources, and no active screen imports from mock data |
| PZ-047 | Implemented | `/login`, public/protected guards, tab-scoped live/demo sessions, legacy `localStorage` credential removal, logout, expiry handling, and return-to-requested-route behavior |
| PZ-048 | Implemented | All-page organization/environment loading plus 24h/7d/30d selectors with persisted valid selections and query propagation |
| PZ-068 | Implemented | Loading, empty, 404, 403, 429, generic error, retry, mutation, and partial-source states appropriate to each screen |
| PZ-049 | Implemented | Overview KPI cards use `/v1/metrics/summary` |
| PZ-050 | Implemented | Payment volume uses `payments.total`; decision distribution and recorded risk-flag counts use live summary metrics |
| PZ-051 | Implemented | Payment feed uses server pagination and `meta.total`, with 30-second live refetch |
| PZ-052 | Implemented | Environment, agent, state, currency, amount, text, time, sort, and pagination are server-side; `meta.total` defines exact pages; saved views persist in the browser |
| PZ-053 | Implemented | Payment, transitions, decisions, trace correlation, exact paginated payment-webhook lookup, delivery attempts, and audited manual transitions |
| PZ-054 | Implemented | Searchable/collapsible trace tree, copy, sensitive-field/value/PII redaction, and redaction markers |
| PZ-055 | Implemented | Native PZ-101 review queue/detail/identity plus 404-only older-server payment fallback |
| PZ-056 | Implemented | Claim, owner-only release, and note-gated reassignment with conflict feedback |
| PZ-057 | Implemented | Approve, decline, request-information, and high/urgent escalation actions |
| PZ-058 | Implemented | Required note validation, 2,000-character maximum, managed key-name/role/tenant identity handling, and inline API errors |
| PZ-059 | Implemented | Authoritative SLA countdown/breach state and priority/SLA sorting; fallback SLA is visibly estimated |
| PZ-060 | Implemented | Live environment policy list, detail, draft document, and version history |
| PZ-061 | Implemented | Draft save, publish confirmation, immutable rollback, and field-level version/draft diff |
| PZ-062 | Implemented | Allowlist/blocklist draft CRUD and required audit reason on draft save |
| PZ-063 | Implemented | Unsaved in-browser draft/version simulation and diff with non-persisted results, reasons, risk flags, and policy source |
| PZ-064 | Implemented with contract boundary | Agent inventory, metadata, filters, details, and enable/disable; current backend uses generic authenticated-key access and returns no runtime telemetry |
| PZ-065 | Implemented | API-key create, one-time reveal/copy, rotation grace, and revocation |
| PZ-066 | Implemented | Audit exact filters, date ranges, pagination, detail drawer, and formula-safe filtered CSV export |
| PZ-102 | Implemented with contract boundary | Global legacy notifications plus the selected environment's newest 200 webhook deliveries, independent source errors, and client filters |
| PZ-069 | Implemented | Overlay sidebar, stacked route layouts, full-width mobile controls, and horizontally scrolling operational tables |
| UI-DARK | Implemented | Light/dark/system cycle, persisted preference, system default, and dark semantic tokens |
| PZ-070 | Implemented | All protected route screens use `React.lazy` and a shared Suspense loading state |
| PZ-103 | Implemented | React `19.2.8`, React Router `8.3.0`, exact Node engine range, and a runtime dependency list pruned of legacy MUI/Emotion and unused prototype packages |
| PZ-071 | Implemented | Vitest covers session/client behavior and the route manifest; Playwright smoke-loads every route and checks mobile containment |
| PZ-092 | Configured | GitHub Actions quality job and dependent Chromium E2E job on PRs and `main` |
| PZ-072 | Implemented | Playwright exercises required review notes, claim/approve, and policy edit/save/publish through a deterministic intercepted API |
| UI-DOCS | Implemented | Updated canonical docs, exact API map, implementation status, changelog, and generated LLM-context freshness check |

## Capability boundaries

These are intentional disclosures, not mock-data gaps:

- Demo mode is a data-free interface preview.
- Credentials live in tab-scoped `sessionStorage`, not an HttpOnly cookie; legacy `localStorage` credentials are removed.
- The generic agent login probe validates a key but does not prove route-level read access.
- Database-managed reviewer identity is bound to API-key name, environment, and role. Bootstrap-admin labels are not user accounts.
- Organization/environment creation is not exposed by the dashboard.
- Numeric risk scores are unavailable; overview risk visualization uses exact summary `risk_flags` counts.
- Trace relationships are inferred from available correlation fields; payment webhook relationships use exact server lookup.
- Agent last-seen, SDK errors, latency, and health are absent from the backend response.
- Alerts scope webhook deliveries to the selected environment; legacy notifications remain global because that raw response has no environment field.
- Settings currently covers API-key lifecycle only; webhook endpoint and retention controls are not wired.
- Browser E2E has eight fixture workflows plus two separately invoked local service workflows using the real SDK/ingest and mock providers. Production deployment and real payment settlement remain outside this coverage.

## Evidence and verification

Canonical behavior references:

- `src/app/api`
- `src/app/context/DashboardContext.tsx`
- `src/app/routes.tsx`
- `src/app/components/screens`
- `src/styles/theme.css`
- `src/styles/dashboard.css`
- `.github/workflows/ci.yml`
- `src/app/api/*.test.ts`
- `src/app/routes.test.tsx`
- `e2e/dashboard.spec.ts`
- `e2e/review-policy.spec.ts`
- `docs/api-map.md`

Configured local gates:

```bash
npm run check
npm run test:e2e
```

Current-worktree evidence recorded on 2026-07-26:

- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`: passed with 11/11 Vitest tests.
- `npm run test:e2e`: passed 4 Chromium workflows covering all routes, mobile containment, review claim/approval, and policy save/publish.
- `npm audit`: passed with zero production or development vulnerabilities.
- `npm run docs:check`: passed after regenerating the LLM context from the final source and canonical documentation.

Record future command results in the delivery/PR notes; do not convert “configured” to “passing” without a current run.

## Payment-agent workflow evidence — 2026-10-03

The service lane was executed successfully against an isolated SQLite backend on Node 24.19.0: all three payment states, exact request/trace correlation, open review, published policy version 1, and a non-persisting policy simulation. Tutorial captures come from that run. The backend plan, endpoint report, and audit are in its `docs/e2e/` directory.
