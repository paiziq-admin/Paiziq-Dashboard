# Agent Guide

This repo is a React/Vite dashboard prototype. When working here, use the attached HTML export as the visual source of truth:

`/Users/chavz/Downloads/Payment Agent Audit Layer.html`

## Rules For Future Agents

- Preserve the glass-panel aubergine/orange design system.
- Prefer existing primitives in `src/app/components/primitives` before creating a new visual component.
- Do not reintroduce MUI page components for dashboard screens.
- Keep route-level screens under `src/app/components/screens`.
- Keep design decisions editable through `src/styles/theme.css`, `src/styles/dashboard.css`, and helpers in `src/app/lib`.
- Use CSS grid table primitives for operational tables.
- Use IBM Plex Mono for IDs, timestamps, API keys, agent names, and JSON traces.
- Keep reviewer note gating intact for approve/reject workflows.

## Verification Checklist

- `npm run build`
- Confirm no active dashboard screen imports `@mui/material`.
- Check routes: `/`, `/payments`, `/payments/:id`, `/reviews`, `/policies`, `/agents`, `/audit`, `/alerts`, `/settings`.
- Compare against the attached HTML at 1440px.
- Check responsive behavior around 768px and 375px.
- Verify keyboard focus is visible on links, buttons, filters, drawer controls, and row actions.

