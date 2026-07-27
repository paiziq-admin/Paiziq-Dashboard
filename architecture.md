# Architecture

## Runtime composition

`src/app/App.tsx` composes three application-wide concerns:

1. `ThemeProvider` applies and persists the light/dark/system theme.
2. `DashboardProviders` supplies session and workspace state.
3. `RouterProvider` renders the guarded, code-split route tree.

`DashboardShell` owns the persistent sidebar, top bar, mobile navigation overlay, and scrollable route outlet. `/login` is public-only; every dashboard route is wrapped by `RequireSession`. Unknown protected paths redirect to `/`.

Each route screen is imported with `React.lazy` in `src/app/routes.tsx` and rendered through a `Suspense` loading panel. The shell, login, providers, and shared loading UI remain in the initial bundle.

## Session and workspace state

`src/app/context/DashboardContext.tsx` separates session state from workspace selection:

```text
login URL + API key
        |
        v
GET /v1/agents?limit=1 (generic authenticated-key probe)
        |
        v
persist live session -> load organizations -> select organization
                                      |
                                      v
                              load environments
                                      |
                                      v
                     selected env + 24h/7d/30d range
                                      |
                                      v
                              route-level queries
```

- Live sessions persist `{mode, endpoint, apiKey}` in tab-scoped `sessionStorage` under `paiziq.dashboard.session`; reload survives, while tab close or sign-out clears the credentials.
- Demo sessions persist only `mode: "demo"` in `sessionStorage` and contain no endpoint or key.
- Session load/save/clear removes the same key from `localStorage`, so a pre-migration credential is never revived.
- A backend 401 dispatches `paiziq:session-expired`, clears the session, and returns the operator to login.
- A 403 stays in the current session and renders a permission-specific state.
- The login probe proves connectivity and key validity, not read capability for every route; screen requests remain authoritative.
- Organization, environment, and time range persist in `paiziq.dashboard.workspace`; stored IDs are reused only if the backend still returns them.
- The first available organization and environment become the fallback selection.
- Organization and environment selectors walk all `limit=200` pages before validating or selecting an ID.

The top bar owns the global selectors. Changing an organization clears the selected environment before loading that organization's environments. The 24-hour, 7-day, and 30-day selections are converted to `from_ms`/`to_ms` at request time.

## API layer

The API layer is under `src/app/api`:

- `config.ts` normalizes endpoints and persists/clears browser sessions.
- `client.ts` adds bearer authentication, serializes request bodies, unwraps control-plane envelopes, passes raw ingest responses through, and normalizes failures as `ApiError`.
- `types.ts` defines the dashboard's epoch-millisecond wire models.
- `resources.ts` contains the typed functions used by metrics, payments, policies, agents, keys, audit, traces, search, and webhook-delivery views.
- `reviews.ts` adapts the PZ-101 review workflow and exposes capability flags for an older-server fallback.
- `admin.ts` contains paginated read helpers shared by policy/admin screens.

Successful control-plane responses and domain errors use `{success, data, error, meta?}`. Authentication/dependency and FastAPI schema-validation errors may instead use raw `{"detail": ...}` responses, which the client also normalizes. `/v1/traces/{trace_id}` and `/v1/notifications` use raw ingest shapes. The client parses `Retry-After` on 429 responses for presentation, but does not silently retry a mutation or invent replacement data.

See `docs/api-map.md` for the exact paths, query strings, request bodies, and required roles.

## Screen data flow

| Area | Live behavior |
| --- | --- |
| Overview | Summary plus one `payments.total` timeseries; `risk_flags`; newest eight payments via `created_desc` |
| Payment feed | Server-side environment/agent/state/currency/amount/text/time filters, sort, exact total, and pagination |
| Payment detail | Primary payment first; decisions, trace correlation, and exact paginated `env_id` + `payment_id` webhook lookup settle independently |
| Reviews | Open PZ-101 queue/detail and `GET /v1/reviews/identity`; role/tenant/identity-bound actions; 404-only older-server fallback |
| Policies | Environment policy list, detail/version history, reason-audited draft saves, publish/rollback, local unsaved-draft diff, and inline unsaved-draft simulation |
| Agents | Environment inventory and status patches through the backend's generic authenticated-key dependency |
| Audit | Server-side exact filters and pagination; CSV export walks all matching pages |
| Alerts | Global legacy notifications and selected-environment webhook deliveries settle independently so one source may render if the other fails |
| Settings | Environment API-key inventory and admin lifecycle operations |

No active route screen imports `src/app/data`. Those files are legacy design fixtures, not runtime fallbacks.

## Asynchronous and authorization states

`AsyncBoundary` provides shared loading, 404, 403, 429, generic failure, retry, and empty states for primary live-data screens. Admin screens use the equivalent helpers in `AdminSupport`. Reviews use workflow-specific states, and Alerts can display a partial feed alongside a per-source error.

Mutations preserve backend failures:

- 403 messages distinguish read, review, ingest, and admin capability where the screen has that context.
- 409 review ownership/state conflicts ask the operator to refresh.
- Managed reviewer names, roles, tenant scope, notes, and ownership are validated before review actions.
- Policy drafts validate threshold, budget, ratio, and velocity values before saving.
- Policy draft saves require an audit reason; diff and simulation read the current browser draft before it is saved.
- One-time API-key secrets are removed from list state and disappear when the reveal dialog closes.

## Review compatibility boundary

Current backends expose `GET /v1/reviews`, `GET /v1/reviews/identity`, review detail, claim, release, reassign, request-more-info, escalate, approve, decline, and the legacy `reject` alias.

`reviews.ts` falls back only when the queue endpoint returns 404:

- Queue: `GET /v1/payments?state=needs_review`
- Resolution: `POST /v1/payments/{id}/transition`
- Supported fallback actions: approve and decline
- Disabled fallback actions: claim, release, reassign, request information, and escalate
- Fallback SLA: estimated 24 hours from payment queue entry, visibly marked with `~`

This is deployment compatibility, not mock data. Native PZ-101 results carry the authoritative priority, SLA deadline, assignment, and embedded payment.

## Presentation architecture

`src/styles/theme.css` contains light and dark semantic tokens, glass surfaces, chart colors, typography, radius, and Tailwind bridges. `src/styles/dashboard.css` contains reusable operational classes such as `.glass-panel`, `.control`, `.grid-table-row`, `.responsive-stack`, `.mobile-wrap`, and `.mobile-full`.

Reusable UI lives in `src/app/components/primitives`; custom SVG charts live in `src/app/components/charts`. Route screens use CSS-grid tables rather than MUI. At or below 1024px the desktop sidebar becomes an overlay and multi-column screen layouts stack. At or below 640px toolbar groups and primary controls become full width. Tables retain a minimum content width inside horizontal scrollers.

## Deliberate capability boundaries

- Numeric risk-score buckets are absent from the v1 metrics contract, so the overview charts the summary's recorded `risk_flags` instead.
- Trace correlation tries request ID and payment ID directly, then event search; a miss is not proof that no trace exists.
- Payment and review webhook delivery lists support exact server-side `payment_id` / `review_id` payload correlation. Payment detail walks every matching page and loads attempt details in batches of 20.
- Agent health/telemetry fields are not inferred.
- Audit actor/action/resource filters are exact backend matches.
- Alerts apply the selected environment to webhook deliveries; the legacy raw notification feed has no environment field or filter.
- Settings currently manage API keys only; webhook endpoints and retention are not wired to a screen.
