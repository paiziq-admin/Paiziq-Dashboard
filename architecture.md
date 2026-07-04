# Architecture

## Application Shell

`DashboardShell` owns the full-screen layout:

- Fixed 228px desktop sidebar
- 56px glass top bar
- Radial gradient background
- Scrollable route content area
- Mobile overlay sidebar below 1024px

Routes are defined in `src/app/routes.tsx` with `react-router`.

## Design System

The dashboard uses two style layers:

- `theme.css` defines semantic tokens for palette, glass surfaces, shadows, radius, font families, and Tailwind bridges.
- `dashboard.css` defines reusable operational classes such as `.glass-panel`, `.control`, `.grid-table-row`, `.label-caps`, `.mono`, and responsive helpers.

Shared React primitives live in `src/app/components/primitives`:

- Panels: `GlassPanel`
- Badges and dots: `StatusBadge`, `RiskBadge`, `DecisionBadge`, `AuditActionBadge`, `StatusDot`
- Tables: `GridTable`, `GridRow`, `GridCell`
- Forms and actions: `FilterBar`, `ActionButton`, `SegmentedTabs`
- Detail UI: `Timeline`, `DrawerPanel`, `KeyValueGrid`, `CodeBlock`, `EmptyState`

## Data Flow

Mock domain data is split by feature area:

- `payments.ts` - payment feed, detail, risk signals, timeline events
- `policies.ts` - thresholds, policy versions, rule weights, allow/block lists
- `agents.ts` - registered agents, SDK errors, API keys
- `audit.ts` - immutable audit events
- `alerts.ts` - alert cards

Screens import data directly for prototype behavior. Formatting and display rules are centralized in `src/app/lib`.

## Screens

Each screen is a route-level component under `src/app/components/screens`:

- `overview` - metrics, SVG charts, high-risk payments, system health
- `payments` - feed table, quick preview, detail trace
- `reviews` - queue table, selected review detail, note-gated actions
- `policies` - tabs, thresholds, rule toggles, lists, simulator
- `agents` - agent health, SDK errors, API key reveal
- `audit` - immutable table and metadata drawer
- `alerts` - severity cards
- `settings` - organization and notification toggles

