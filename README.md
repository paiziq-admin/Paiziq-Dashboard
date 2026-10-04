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

## Azure Deployment

The development dashboard is hosted at https://brave-river-0a6dd1310.5.azurestaticapps.net
using Azure Static Web Apps (Free), in resource group `paiziq-dev`, Central US.
It currently displays mock data. Deployment uploads the `dist` build without a
server. `public/staticwebapp.config.json` enables direct links
and refreshes on React routes and is copied into `dist` by Vite.

### Manual GitHub deployment

Push your changes, then open the repository's **Actions** tab, select
**Deploy dashboard to Azure**, click **Run workflow**, choose the branch containing
your changes (normally `main`), and click **Run workflow** again. The selected
branch is built and deployed to the existing live development dashboard.
Pushes and pull requests do not trigger deployment.

The workflow uses the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
Only one deployment runs at a time.

### Local deployment

After signing in with `az login`, you can also redeploy locally:

```bash
npm run build
SWA_CLI_DEPLOYMENT_TOKEN="$(az staticwebapp secrets list \
  --subscription 8406cce0-3a67-4d8e-b536-965b930989af \
  --resource-group paiziq-dev --name paiziq-dashboard-dev \
  --query properties.apiKey --output tsv)" \
  npx -y @azure/static-web-apps-cli@2.0.10 deploy ./dist --env production --no-use-keychain
```

## Routes

## Design system

The visual reference remains `/Users/chavz/Downloads/Payment Agent Audit Layer.html`.

- Hanken Grotesk for UI copy and IBM Plex Mono for identifiers and wire data
- Glass-panel aubergine/orange surfaces backed by semantic CSS variables
- Light, dark, and system themes persisted under `paiziq.dashboard.theme`
- CSS-grid operational tables with horizontal overflow on narrow screens
- Desktop sidebar at 228px, overlay navigation below 1024px, and stacked layouts below 1024px/640px

The route UI does not use MUI. Reuse primitives in `src/app/components/primitives`, live API functions in `src/app/api`, and semantic tokens in `src/styles/theme.css` before adding another dependency or local abstraction.

The active dashboard no longer imports MUI page components. MUI, Emotion, and Recharts may still appear in `package.json` because the original Figma bundle included them and local shadcn files may still reference Recharts in unused utilities. Remove package dependencies only after confirming no current or planned screens import them.
