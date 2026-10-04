# Paiziq Payment Agent Audit Dashboard

React, TypeScript, and Vite operator dashboard for Paiziq. The application connects to the live control-plane and ingest APIs to inspect payment decisions and traces, operate human reviews, manage policies and API keys, monitor agents, export audit records, and inspect notifications and webhook deliveries.

The active route screens no longer import the legacy files in `src/app/data`. Demo mode is an interface preview without seeded records or backend mutations.

## Run locally

Requirements:

- Node.js `^22.22.0 || >=24.0.0` (CI uses the `22.22` line)
- npm
- A Paiziq backend and a read-capable API key for live data

```bash
npm ci
npm run dev
```

Open the Vite URL, then connect with the backend URL and API key. The login form defaults to `http://127.0.0.1:8800`; the backend development key is commonly `dev-key`.

The dashboard verifies backend connectivity and the API key with `GET /v1/agents?limit=1`. That endpoint currently accepts any authenticated key; each screen still enforces its own read/review/admin/ingest requirement. A live session stores its endpoint and API key in tab-scoped `sessionStorage`, survives reload in that tab, and is removed by sign-out or tab close. The session loader also deletes credentials left in `localStorage` by older builds. Selected organization/environment, time range, theme, saved payment views, and the non-secret reviewer convenience label remain browser-local preferences.

Demo mode stores no endpoint or key. Primary live-data screens render explicit connection/no-data states; the remaining API helpers reject before making a network request. It is not a simulated backend and does not provide sample operational data.

## Implemented routes

| Route | Capability |
| --- | --- |
| `/login` | Live backend/API-key connection or data-free demo mode |
| `/` | Live summary metrics, `payments.total` volume, decision/risk-flag charts, and recent payments |
| `/payments` | Exact server-filtered/sorted pagination, saved views, and 30-second refresh |
| `/payments/:id` | Payment transitions, decisions, correlated trace JSON, and exact payment webhook attempts |
| `/reviews` | PZ-101 review queue, authenticated reviewer identity, assignment, actions, priority, and SLA state |
| `/policies` | Reason-audited draft editing, allow/block lists, publish, rollback, versions, unsaved-draft diff, and simulation |
| `/agents` | Agent inventory, metadata, filtering, and enable/disable |
| `/audit` | Exact filters, pagination, details, and filtered CSV export |
| `/alerts` | Notification and webhook-delivery feed |
| `/settings` | API-key create, one-time reveal/copy, rotation, grace window, and revocation |

All protected screen bundles are loaded with `React.lazy`. Shared loading, empty, not-found, error, rate-limit, authentication, and permission-denied states keep failed requests from being replaced with mock values.

## Verification commands

The repository configures the following checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run docs:check
npm run check
npm run test:e2e
npm run test:e2e:service
```

`npm run check` runs lint, typecheck, unit/component tests, the production build, and the generated-document freshness check. Playwright E2E is separate and is configured in CI after the quality job. These are available gates, not a claim that an arbitrary checkout or backend is currently passing.

## Architecture and contracts

- [Architecture](architecture.md) — providers, API layer, route loading, screen data flow, and UI system
- [Developer guide](developer.md) — local workflow, tests, CI, API conventions, and visual QA
- [Agent guide](agent.md) — repository invariants and change checklist
- [Dashboard API map](docs/api-map.md) — exact live endpoints, query parameters, scopes, and fallbacks
- [Implementation status](docs/implementation-status.md) — backlog coverage and truthful capability boundaries
- [Changelog](changelogs.md) — dated implementation history

Run `npm run docs:context` after changing canonical documentation or the inventoried implementation. CI runs `npm run docs:check` against the generated `docs/llm-context.md`.

## Design system

The visual reference remains `/Users/chavz/Downloads/Payment Agent Audit Layer.html`.

- Hanken Grotesk for UI copy and IBM Plex Mono for identifiers and wire data
- Glass-panel aubergine/orange surfaces backed by semantic CSS variables
- Light, dark, and system themes persisted under `paiziq.dashboard.theme`
- CSS-grid operational tables with horizontal overflow on narrow screens
- Desktop sidebar at 228px, overlay navigation below 1024px, and stacked layouts below 1024px/640px

The route UI does not use MUI. Reuse primitives in `src/app/components/primitives`, live API functions in `src/app/api`, and semantic tokens in `src/styles/theme.css` before adding another dependency or local abstraction.

## Important limitations

- The API key is stored in tab-scoped `sessionStorage`, not an HttpOnly cookie. Use the dashboard only on trusted devices and origins.
- Database-managed reviewer identities are bound to the API-key name, environment, and role. Bootstrap admin keys have no managed reviewer identity, so their acting-reviewer label remains operator-entered metadata rather than a user account.
- The login probe validates a key but does not prove that it has read access to every dashboard resource.
- Numeric risk scores are not part of the v1 metrics contract; the overview shows exact counts for recorded `risk_flags`.
- Agent responses do not include last-seen, SDK-error, latency, or health metrics.
- Webhook deliveries are scoped by the selected environment; the legacy notification feed is global because its raw contract has no environment field.
- Webhook-endpoint management, retention execution, organization/environment creation, and organization preference editing are backend capabilities not exposed by current dashboard screens.
