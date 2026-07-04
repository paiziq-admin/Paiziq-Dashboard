# Developer Notes

## Local Workflow

```bash
npm install
npm run dev
npm run build
```

Use `npm run build` as the primary verification command. This repo does not currently define a separate lint or test script.

## Styling Rules

- Use tokens from `theme.css`; avoid hardcoding new color families unless the HTML source has them.
- Use `dashboard.css` classes for shell surfaces, controls, table rows, labels, and focus behavior.
- Build visual UI from primitives instead of using MUI or generic shadcn component styling.
- Keep cards at 14px radius, controls at 9px, filters at 8px, and badges at 999px.
- Keep operational tables dense and horizontally scrollable on small screens.

## Adding A Screen

1. Add route data to `src/app/lib/nav.ts` if it needs navigation.
2. Add the route component under `src/app/components/screens`.
3. Compose from primitives in `src/app/components/primitives`.
4. Add domain sample data under `src/app/data` if needed.
5. Add the route in `src/app/routes.tsx`.
6. Run `npm run build`.

## Visual QA

Compare the app with `/Users/chavz/Downloads/Payment Agent Audit Layer.html`.

Check:

- 228px desktop sidebar and 56px top bar
- Glass blur and panel borders
- Hanken Grotesk / IBM Plex Mono typography
- Orange line chart, donut chart, and risk bars
- Badge colors and risk thresholds
- Grid column alignment
- Mobile stacking and horizontal table scroll

