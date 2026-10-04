# Changelogs

## 2026-10-04

- Added a post-deployment gate for the hosted root/login routes and exact checked JavaScript/CSS assets. Azure accepting an upload no longer establishes CI deployment success when the served site is unavailable or stale. Removed leftover README conflict markers while retaining the current capability limitations.

- Regenerated the documentation snapshot after the Phase 0 merge to restore the dashboard CI freshness gate. Live Azure verification remains blocked: the subscription reports `Warned`, backend compute is suspended, and the dashboard hostname currently returns Azure HTTP 404.

- Added the Phase 0 execution-evidence panel with read-only execution state, exact scoped spend/reservations, immutable request/policy snapshots and digests, and execution event history. JSON uses the existing secret redaction before display or copy.
- Separated execution evidence from payment approval and legacy terminal reports. Unknown provider results retain a visible no-retry instruction. Removed manual “Mark executed” and “Mark failed” controls.
- Added authenticated evidence reads, partial loading/error/404/403/429 states, explicit evidence refresh, stale-response isolation, API/component coverage, and responsive light/dark browser checks. Added the frontend Phase 0 tracker in implementation status. Large event payloads mount only when opened; truncated event windows show the total count.
- Verified `npm run check` (24 tests plus lint/typecheck/build/docs), all eight fixture browser workflows, and both real-service browser workflows. The Phase 0 service workflow uses the SDK hosted ledger and mock providers, with captured evidence under `docs/phase0-evidence/`.

## 2026-10-03

- Made `main` and `dev` use the development tree, retaining branch ancestry without importing main-only files.
- Added automatic Azure deployment on pushes/merges to `main`, gated by the quality and Chromium workflow checks, using the checked production artifact. Pull requests remain checks-only; manual main deployment remains available.
- Added success/failure/cancellation notifications to a GitHub CI results thread with contributor and collaborator mentions; delivery respects each user's GitHub notification settings.

- Added two payment-agent fixture workflows and one live service workflow covering SDK decisions, all payment states, threshold reasons, policy version, correlated trace events, the open review queue, and live policy simulation.
- Added `test:e2e:service` with a fresh temporary backend database, owned servers, strict ports, and optional `PAIZIQ_DEMO_DIR` screenshot/JSON capture. The service configuration is included in TypeScript checking.
- Captured a nine-screen tutorial against the live local backend. Run instructions and capability boundaries are documented in the backend `docs/e2e/` plan, audit, and tutorial.

## 2026-07-26

- Replaced active screen fixture coupling with an authenticated, typed API layer for organizations, metrics, payments, decisions, traces, reviews, policies, agents, API keys, audit records, notifications, search, and webhook deliveries (PZ-046).
- Added live/demo session handling, `/login`, protected/public-only route guards, 401 expiry, 403 states, tab-scoped `sessionStorage` credentials with legacy `localStorage` cleanup, and all-page organization/environment selectors (PZ-047, PZ-048, PZ-068).
- Connected overview `payments.total` volume and summary `risk_flags`; exact server-filtered/sorted payment pagination; saved browser views; payment detail/timeline; trace inspection with client-side redaction; and exact `payment_id` webhook lookup (PZ-049–PZ-054).
- Connected the native PZ-101 human-review queue and `GET /v1/reviews/identity` with key-name/tenant/role-bound actions, required notes, assignment, approve/decline, request-information, escalation, priority sorting, and SLA breach indicators; retained a visibly limited 404-only fallback for older servers (PZ-055–PZ-059).
- Added live policy draft/list editing with audit reasons, publish, immutable rollback, in-browser unsaved-draft diff/simulation, agent status controls, API-key lifecycle, audit filtering/CSV export, and notification/webhook-delivery alerts (PZ-060–PZ-066, PZ-102).
- Added responsive route layouts and mobile navigation, persisted light/dark/system themes, lazy-loaded route bundles, upgraded to React `19.2.8` and React Router `8.3.0`, declared Node `^22.22.0 || >=24.0.0`, and pruned runtime dependencies to the packages used by the shipped UI (PZ-069, UI-DARK, PZ-070, PZ-103).
- Added strict TypeScript, ESLint 10, Vitest/Testing Library coverage, Playwright all-route/mobile/review/policy workflows, GitHub Actions quality/E2E jobs, and canonical-document/LLM-context freshness commands covering active source/tooling plus the changelog and implementation status (PZ-071, PZ-072, PZ-092, UI-DOCS).
- Updated the README, architecture, developer/agent guides, API map, and implementation-status documentation to describe live behavior and remaining contract boundaries without mock/gap claims.
- Verified the final dashboard code with ESLint, strict TypeScript, 11 Vitest tests, the production build, 4 Playwright Chromium workflows, and a full npm audit reporting zero vulnerabilities. Regenerated the LLM context from the final source and canonical documentation.

## 2026-07-05

- Added `docs/api-map.md`: full screen→endpoint map against the live
  backend OpenAPI surface (auth scopes, envelope, pagination, epoch-ms
  timestamps), including the reviews-API gap and local-dev setup.
- Persisted the browser-preview CSS refinements to source (sidebar,
  top bar, dashboard.css).
- Audit drawer now always shows the Reason field with a muted
  "— no reason recorded" placeholder instead of hiding it (PZ-067).
  Verified sources are mojibake-free (masked keys render ASCII `*`).

## 2026-07-04

- Rebuilt the dashboard shell around the attached Payment Agent Audit Layer HTML design.
- Added self-hosted Hanken Grotesk and IBM Plex Mono font assets extracted from the HTML bundle.
- Replaced generic shadcn theme values with glass-panel aubergine/orange dashboard tokens.
- Added reusable dashboard primitives for panels, badges, filters, grid tables, timelines, actions, drawers, tabs, code blocks, and empty states.
- Added custom SVG overview charts matching the HTML prototype.
- Split mock data into payments, policies, agents, audit, and alerts modules.
- Migrated Overview, Payment Feed, Payment Detail, Human Reviews, Policies, Agents, Audit, Alerts, and Settings screens.
- Added `/alerts` and `/settings` routes while preserving existing routes.
- Removed legacy MUI screen components from active source.
- Added `agent.md`, `architecture.md`, `developer.md`, and updated `README.md`.
