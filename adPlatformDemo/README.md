# Harbor Point Bank marketing dashboard

Next.js app for the ADBOX Dashboard Product Engineer exercise. Loads Meta, Google Ads, and Amazon DSP exports from the repo root, normalizes them, matches campaigns to initiatives, and renders filters, KPIs, a configurable chart, and a totals table.

## Run locally

From this directory (Node.js 20+):

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test                         # Vitest
npm run build && npm start       # production
```

## Layout

- `src/lib/` — ingest, campaigns, matching, metrics, dashboard data
- `src/config/` — initiatives (`internalCampaigns.ts`) and manual overrides
- `src/components/` — Dashboard, MetricChart, TotalsTable, Select, UI kit
- `docs/design-doc.md` — design decisions and tradeoffs
- `docs/ai-transcript.md` — scrubbed Cursor chat export
