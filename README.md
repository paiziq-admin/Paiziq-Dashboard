# Payment Agent Audit Layer Dashboard

React/Vite prototype for a fintech risk operations dashboard. The UI monitors payment agents, risk scoring, audit trails, trace inspection, policy configuration, SDK health, alerts, and human-in-the-loop approvals.

## Design Source Of Truth

The visual source of truth is `/Users/chavz/Downloads/Payment Agent Audit Layer.html`.

The app intentionally uses the attached HTML's glass-panel aubergine/orange system:

- Hanken Grotesk for UI text
- IBM Plex Mono for payment IDs, timestamps, keys, and trace data
- Glass panels over the radial gray/orange/aubergine background
- Compact CSS grid tables instead of MUI tables
- Local primitives for badges, cards, filters, drawers, tabs, and action buttons

## Running

```bash
npm install
npm run dev
npm run build
```

## Routes

- `/` - Overview
- `/payments` - Live payment feed
- `/payments/:id` - Payment detail / trace view
- `/reviews` - Human review queue
- `/policies` - Risk policy and thresholds
- `/agents` - Agent and SDK monitoring
- `/audit` - Immutable audit log
- `/alerts` - Alerts
- `/settings` - Organization and notifications

## Project Shape

- `src/styles/theme.css` - editable semantic tokens
- `src/styles/dashboard.css` - dashboard utility classes and interaction states
- `src/app/lib` - formatting, nav, risk badge, and token helpers
- `src/app/data` - mock domain data split by area
- `src/app/components/layout` - shell, sidebar, top bar
- `src/app/components/primitives` - reusable dashboard UI building blocks
- `src/app/components/charts` - custom SVG charts
- `src/app/components/screens` - route-level screens

## Dependency Policy

The active dashboard no longer imports MUI page components. MUI, Emotion, and Recharts may still appear in `package.json` because the original Figma bundle included them and local shadcn files may still reference Recharts in unused utilities. Remove package dependencies only after confirming no current or planned screens import them.

