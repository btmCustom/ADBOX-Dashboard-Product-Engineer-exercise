# Harbor Point Bank dashboard — design doc

**Time spent:** about 1 hour 40 minutes (this session, ~2:40–4:20 PM PT), including build, tests, design doc, and polish.

**Stack:** Next.js (App Router) + TypeScript in `addPlatformDemo/`. Data is loaded from the three packet files at build/request time; Vitest covers ingest, matching, metrics, and the interactive UI.

## Data model

Grain is one **normalized row** per external campaign per day: `date`, `externalCampaignId`, `campaignName`, `spend`, `impressions`, `clicks`, `conversions`, `conversionValue`. There is no separate channel column — channel lives in the ID prefix (`meta/…`, `gads/…`, `amzn/…`), so IDs stay unique across platforms and `channelOf()` is a parse, not a join.

**Campaigns** are derived *after* normalization (`buildCampaigns`), not inside each loader. One pass over normalized rows gives one campaign per ID (latest name wins). Matching and grouping only see that list. A fourth platform is therefore “write a loader that emits `NormalizedRow`,” not a rewrite of matching or the UI. (Detailed source→field maps: `data-model.md` in this folder.)

In production the same shapes would be tables: upserted `normalized_rows`, upserted `campaigns` (with match status), and editable `internal_campaigns` / `campaign_overrides` instead of config files.

## Normalization — decisions and why

| Choice | Alternative | Why this |
|---|---|---|
| Google `cost_micros` ÷ 1e6 → USD | Keep micros and convert only in the UI | One money unit everywhere; rate math stays simple |
| Meta conversion = `actions` / `action_values` where `action_type = lead` | Sum all action types, or use `offsite_conversion.fb_pixel_lead` | `lead` and the pixel lead double-count the same events; only `lead` has matching `action_values` |
| Ignore Meta `link_click` | Treat as conversions or extra clicks | It duplicates the top-level `clicks` field |
| Amazon `offAmazonConversions14d` kept as reported | Rescale to a common attribution window | Windows differ by platform; inventing a harmonization would fake precision. Cross-channel CPA/ROAS are still useful but not apples-to-apples — called out in the UI/docs, not silently “fixed” |
| Amazon MM/DD/YYYY → ISO; bad numbers / bad CSV rows throw | Coerce to 0 | Silent zeros hide bad exports |

Rate metrics (CPC, CPM, CPA, ROAS) are always **recomputed from summed numerators and denominators** at the grouping on screen — never averaged across days or campaigns.

## Campaign matching

Initiatives come from `initiatives.md` → `src/config/internalCampaigns.ts` (id, display name, regexes on `normalizedName`). Name normalization collapses casing, camelCase, and separators (`FallRatePromo_Search` and `FALL_RATE_PROMO-Search` → `fall rate promo search`) so patterns stay short.

Match order: **manual override by external ID** → else exactly one pattern hit (**auto**) → else multiple hits (**ambiguous**, no initiative) → else **unmatched**. Overrides are keyed by ID so a platform rename does not break the mapping (e.g. typo “Fal Rate Promo”). Ambiguous and unmatched are first-class report groups so initiative + review buckets always reconcile to the grand total — nothing is dropped or guessed into an initiative.

## UI tradeoffs (what we discussed)

- **Configurable chart:** Metric + dimension dropdowns redraw from the same filtered rows. Categorical breakouts (channel / initiative / campaign) use a **ranked list with proportional bars** instead of a horizontal Recharts bar chart. Long names were unreadable on narrow viewports with a fixed Y-axis width; the brief grades “marketer can tell what is performing at a glance,” so full labels + values beat a prettier but clipped chart. Day/week keep a line chart.
- **Mobile polish:** KPI cards `auto-fit` with a min width (stack to one column when tight); alert path wraps; campaign labels truncate with a char cap on small screens; totals-table row click highlights the full row for horizontal scanning.
- **Not chased:** Lighthouse “render-blocking CSS” (~40 ms on a ~6 KiB chunk on localhost). Out of scope relative to correctness and the design/recap deliverables.
- **Tests:** Vitest over loaders (real files), matching statuses, reconciliation, and Dashboard / chart / table / Select behavior — cheap insurance for the numbers the call will walk through.

## What we cut

Date-range and campaign filters; more than one chart; live API connectors; a matching admin UI (config file is enough for the exercise); harmonized attribution; pixel-perfect design-system completeness beyond a clean Untitled-UI-inspired layout.

## First change at 50 clients

Move initiatives, patterns, and overrides into a **database (or admin UI)** with per-client scope, and persist normalized rows + campaigns on import. Pattern-only matching will not scale across naming conventions; humans need to fix unmatched/ambiguous without a deploy, and restatements need upsert-by-(campaign, date) rather than “rebuild from three files on each page load.” Auth, scheduling, and rate limits for live Meta/Google/Amazon pulls are the next layer after that persistence model — not before it.
