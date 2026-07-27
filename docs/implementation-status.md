# Dashboard Implementation Status

Verified against the active dashboard source and backend PZ-101 review surface on 2026-07-26. “Configured” means the repository contains the command/workflow configuration; it is not a claim that the gate passed in every environment.

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
- Browser E2E uses an intercepted contract fixture; live backend/deployment integration remains a separate verification concern.

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
