# Agent Guide

This repository is a live-backed React/Vite operator dashboard. Treat the generated backend OpenAPI contract and the active route code as the behavioral source of truth; use `/Users/chavz/Downloads/Payment Agent Audit Layer.html` only as the visual reference.

## Read first

1. `README.md`
2. `architecture.md`
3. `developer.md`
4. `docs/api-map.md`
5. `docs/implementation-status.md`
6. The target screen, its API wrapper, and its wire types

## Repository invariants

- Keep `/login` public-only and all operator routes under `RequireSession`.
- Preserve live and demo session modes. Demo is data-free and must not quietly render fixtures as live records.
- Keep live endpoint/API-key credentials in `sessionStorage`; remove the legacy session key from `localStorage` on load, save, and clear.
- Never couple an active screen to `src/app/data`.
- Use the selected environment and global time range where the backend supports them.
- Keep API calls in `src/app/api`; screens should not assemble authenticated `fetch` calls.
- Preserve envelope/raw-response handling, `ApiError`, `meta.total`, epoch milliseconds, 401 expiry, 403 states, and 429 guidance.
- Keep route-level screens lazy-loaded.
- Preserve light/dark/system theme cycling and semantic theme tokens.
- Reuse primitives and CSS-grid operational tables; do not reintroduce MUI screen components.

## Workflow guardrails

- Load reviewer identity from `GET /v1/reviews/identity`. Database-managed keys lock the acting reviewer to the key name and environment; only bootstrap admins supply a convenience label.
- Keep developer/read-only review actions visibly unavailable, and never treat browser-stored reviewer convenience metadata as a credential.
- Require nonblank notes for reassign, request-info, escalate, approve, and decline. Release notes remain optional.
- Do not bypass `/v1/reviews` to resolve a native review. The older-server payment transition is allowed only after the queue endpoint returns 404.
- Preserve capability flags and visibly disabled unsupported actions in review fallback mode.
- Keep policy save separate from publish. Publishing requires a saved draft; rollback creates a new immutable version.
- Require a nonblank audit reason when the dashboard saves a policy draft, and send it with the document.
- Keep draft simulation and any diff involving `draft` tied to the current in-browser document so unsaved edits are included.
- Keep API-key secrets one-time: never add a reveal control to list responses or persist create/rotate secrets.
- Do not infer agent health, SDK errors, last-seen, or latency from fields the API does not return. Keep the legacy notification feed visibly global while scoping webhook deliveries by the selected environment.
- Keep payment currency, amount, text, time, and sort controls on the server request; page counts must come from the filtered `meta.total`.

## UI rules

- Preserve the glass-panel aubergine/orange design system.
- Use Hanken Grotesk for UI copy and IBM Plex Mono for IDs, timestamps, API keys, agent names, and JSON.
- Use `src/styles/theme.css` for colors/surfaces and `src/styles/dashboard.css` for reusable layout behavior.
- Keep the desktop sidebar at 228px and the top bar at 56px.
- At 1024px, use the navigation overlay and stack multi-column route layouts.
- At 640px, stack toolbar groups and expand primary controls to full width.
- Keep tables in horizontal scrollers on narrow viewports.
- Preserve visible keyboard focus and semantic loading/status/error announcements.

## Verification

Run the configured non-browser gate:

```bash
npm run check
```

Run the browser workflow gate separately:

```bash
npm run test:e2e
```

Then regenerate documentation if canonical docs or inventoried source changed:

```bash
npm run docs:context
npm run docs:check
```

Never report a gate as passing unless it was run successfully in the current worktree. CI is configured in `.github/workflows/ci.yml`; configuration alone is not execution evidence.

Before handing off, inspect the login redirect, a 403 state, workspace selector refetches, the review note/ownership flow, policy save/publish separation, one-time secret handling, both themes, and responsive behavior at desktop/tablet/phone widths.
