# Professional Pendant Designer 3D

A production-focused pendant design tool with guided workflow, manufacturing validation, business estimation, and export utilities.

## Live local development

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open: `http://localhost:5173`

## Major upgrades in this version

- UTF-8 and copy cleanup baseline.
- Inline event handlers replaced by event-driven bootstrap (`data-on*` binding).
- Vite + ESLint + Prettier + Vitest + GitHub CI.
- Guided wizard flow: Shape -> Material -> Gem -> Engraving -> Export.
- Progressive disclosure: Basic/Advanced UX mode.
- Real-time manufacturing constraints and print profile checks.
- Saveable named projects with version history.
- PDF manufacturing report export.
- Cost estimator + BOM CSV export.
- Read-only share link mode for reviews.
- Performance mode + exposure/environment controls.
- Preset marketplace structure (starter cards).

## Key files

- `main.js` - entrypoint and module bootstrap
- `app-bootstrap.js` - declarative event binding layer
- `pro-workbench.js` - wizard, validation, business tools, versioning
- `pro-utils.js` - validation/cost/share/BOM utilities
- `core.js`, `geometry.js`, `ui-controls.js` - existing rendering and modeling engine

## Quality commands

- `npm run lint`
- `npm run test`
- `npm run build`

## Notes

- Existing engine APIs are preserved to avoid regressions.
- Workbench is layered on top, so further refactoring can proceed incrementally.
