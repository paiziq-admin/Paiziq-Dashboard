# Changelogs

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

