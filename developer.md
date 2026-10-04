# Developer Guide

## Local workflow

Use Node.js `^22.22.0 || >=24.0.0`, matching `package.json`. CI pins the `22.22` line.

```bash
npm ci
npm run dev
```

The dashboard login defaults to `http://127.0.0.1:8800`. For the backend development service, start the ingest API from the backend repository and connect with an appropriate API key. The backend must allow the Vite origin through `PAIZIQ_CORS_ORIGINS`.

`npm install` is appropriate when intentionally changing dependencies; use `npm ci` for a lockfile-reproducible checkout.

The UI runtime is pinned to React `19.2.8` and React Router `8.3.0`. Runtime dependencies are intentionally limited to React/React DOM/React Router, `lucide-react`, `next-themes`, `clsx`, `tailwind-merge`, and `tw-animate-css`; test, lint, TypeScript, Tailwind, and Vite packages remain development-only.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run preview` | Preview an existing production build |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run lint` | Run the flat ESLint configuration with zero warnings allowed |
| `npm run typecheck` | Run strict TypeScript checking without emitting files |
| `npm run test` | Run Vitest once in jsdom |
| `npm run test:watch` | Run Vitest interactively |
| `npm run test:e2e` | Run the six fixture Chromium workflows |
| `npm run test:e2e:service` | Start isolated ingest + Vite and run the live SDK workflow |
| `npm run docs:context` | Regenerate `docs/llm-context.md` |
| `npm run docs:check` | Fail if the generated LLM context is stale |
| `npm run check` | Run lint, typecheck, unit tests, build, and docs freshness in sequence |

The command table describes configured tasks; it does not assert that they pass before they are run in the current checkout.

Playwright starts Vite on `http://127.0.0.1:4173`. Install its Chromium browser once on a new machine:

```bash
npx playwright install chromium
npm run test:e2e
```

The checked-in E2E suite intercepts the Paiziq API with a deterministic contract fixture. It covers every route, mobile containment for payment/review screens, reviewer note/claim/approve behavior, and policy edit/save/publish behavior. It validates browser workflow wiring; it is not a substitute for backend integration or deployment smoke testing.

## Live payment-agent workflow

Use the paired backend checkout at `../paiziq_backend/files/paiziq`, or set
`PAIZIQ_BACKEND_DIR` to its absolute path. Prepare it with `make venv`,
`make install`, and `make ingest-install`. Stop manual servers on ports 8800
and 4173, then run `npm run test:e2e:service`. This command creates a temporary
SQLite database and owns both servers; it never clears the manual demo database.

The single service test seeds the SDK's approved/executed, needs-review, and
rejected scenarios, signs in, selects the run's environment, verifies the exact
trace correlation, and checks the review queue and published policy simulation.
Set `PAIZIQ_DEMO_DIR=/absolute/output/path` to capture nine screenshots plus
`workflow.json`. The backend `docs/e2e/PAYMENT_AGENT_WORKFLOW_TUTORIAL.md` contains
the complete reproducible guide, with plan/audit evidence alongside it.
This is local MockGateway coverage; the service lane is separate from fixture CI.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main` with read-only repository permissions:

1. The `quality` job uses Node `22.22`, runs `npm ci`, then `npm run check`.
2. The dependent `e2e` job installs Playwright Chromium with system dependencies, then runs `npm run test:e2e`.

The E2E job is intentionally separate from `npm run check`, which keeps the local quality loop independent of a browser installation.

## Adding or changing a live screen

1. Confirm the backend path, method, scope, query parameters, request body, envelope, pagination, and timestamps in the generated OpenAPI file.
2. Add or update the wire type in `src/app/api/types.ts`.
3. Add the smallest typed wrapper in `resources.ts`, `reviews.ts`, or `admin.ts`.
4. Use the shared session/workspace selectors; never hardcode an environment.
5. Model loading, empty, 404, 403, 429, generic failure, retry, and partial-section failures where applicable.
6. Keep backend-supported filters on the request and label any browser-page filtering.
7. Add the route screen under `src/app/components/screens` and lazy-load it from `routes.tsx`.
8. Add unit/component coverage and an E2E workflow assertion for material operator actions.
9. Update `docs/api-map.md`, `docs/implementation-status.md`, and the changelog when behavior changes.
10. Run `npm run docs:context` last, after source and canonical docs are stable.

Do not add a fixture fallback to hide an API failure. Demo mode is explicitly data-free. The only compatibility fallback is the documented 404 path for pre-PZ-101 review servers.

## API rules

- Send `Authorization: Bearer <key>` on every API call.
- Preserve integer epoch-millisecond fields and `limit`/`offset` pagination.
- Use `meta.total` for page counts when the backend returns it.
- Do not treat 403 as session expiry; it is an authorization state.
- Do not automatically replay mutations after 429 or a network failure.
- Encode path and query values.
- Keep raw ingest shapes limited to the endpoints that actually return them.
- Reviewer/admin/ingest mutations must show capability-specific errors.
- Keep live endpoint/API-key credentials in `sessionStorage`, and continue deleting the legacy `localStorage` session key.
- Never retain a plaintext key returned by create/rotate after the one-time reveal closes.

Load `GET /v1/reviews/identity` with the queue. For a database-managed key, the backend binds reviewer actions to the key's name, environment, and role, and the dashboard makes that acting identity read-only. A bootstrap admin has no managed identity and may enter an acting label, stored under `paiziq.dashboard.reviewer-id` only as non-secret convenience metadata. Reassignment sends the target reviewer ID, while the backend still records the authenticated key identity as the actor.

## Styling and responsive rules

- Use semantic variables from `src/styles/theme.css`; every new surface must work in light and dark themes.
- Use `src/styles/dashboard.css` for shell, controls, tables, loading indicators, and responsive helpers.
- Prefer primitives from `src/app/components/primitives`.
- Keep operational tables horizontally scrollable instead of collapsing columns into unreadable content.
- Test the overlay sidebar and stacked layouts around 1024px.
- Test full-width toolbar/control behavior around 640px and the supported 320px minimum viewport.
- Keep keyboard focus visible on navigation, forms, rows, drawers, dialogs, and workflow actions.
- Preserve Hanken Grotesk for UI copy and IBM Plex Mono for identifiers, timestamps, secrets, and JSON.

The design reference is `/Users/chavz/Downloads/Payment Agent Audit Layer.html`; source code and live contract behavior take precedence over any stale data shown in the export.

## Generated documentation

`scripts/generate-llm-context.mjs` combines package commands; the active application, test, script, asset, workflow, and root-tooling inventory/digest; and the README, agent/architecture/developer guides, changelog, API map, and implementation status into `docs/llm-context.md`.

Do not edit the generated file by hand. After changing an inventoried source file or canonical documentation:

```bash
npm run docs:context
npm run docs:check
```

## Pre-handoff checklist

```bash
npm run check
npm run test:e2e
```

Also verify:

- No active route screen imports `src/app/data` or `@mui/material`.
- `/login` redirects signed-in users and protected routes preserve the requested destination.
- Live 401 and 403 behavior differs correctly.
- Organization/environment/time-range changes refetch the affected data.
- Review notes, ownership conflicts, and fallback capabilities remain intact.
- Theme selection survives reload and both themes preserve readable contrast.
- Payment, review, policy, and detail layouts remain usable at desktop, tablet, and phone widths.
