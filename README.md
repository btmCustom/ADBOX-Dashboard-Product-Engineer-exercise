# ADBOX Dashboard Product Engineer: Build Exercise

Start with `ADBOX-Dashboard-Product-Engineer-Assessment.pdf`. It is the full brief: what to build, what to send back and how we evaluate. This README covers the files and a submission checklist.

**Time:** plan on about 2 hours to build, plus about 30 minutes for the design doc, recap video and AI transcript. There is no timer or hard cutoff. Tell us roughly how long you spent at the top of your README.

The data covers August 1 to September 29, 2026 (60 days) for one client, Harbor Point Bank.

## Files

- `meta_insights.json`: Meta Marketing API Insights response shape. Daily rows per campaign.
  Cost is in `spend` (USD, string). Conversions are nested in `actions[]` by `action_type`;
  conversion value is in `action_values[]`. Note that `link_click` in `actions` duplicates `clicks`.
- `google_ads.csv`: Google Ads API report shape. Daily rows per campaign.
  Cost is `metrics.cost_micros` (1,000,000 micros = 1 USD). Conversions can be fractional.
- `amazon_dsp.csv`: Amazon DSP report shape. Daily rows per order (Amazon's name for a campaign).
  Cost is `totalCost` (USD). Conversions are off-Amazon conversions (actions on the bank's own website,
  tracked by Amazon), reported on a 14-day attribution window: `offAmazonConversions14d` and
  `offAmazonConversionValue14d`. Column names are simplified from Amazon DSP's off-Amazon conversion metrics.
  Dates are MM/DD/YYYY.
- `initiatives.md`: the three client initiatives by their proper names. No mapping to campaign names is provided.

All money is in USD.

## Metric definitions to use

- CPC = cost / clicks
- CPM = cost / impressions * 1000
- CPA = cost / conversions
- ROAS = conversion value / cost

Use these definitions consistently across all three platforms. Rate metrics are always computed from summed
numerators and denominators at the grouping being shown, never by averaging rates. Where a platform reports
something that does not map cleanly (for example, which Meta action counts as a conversion), decide, and document your decision.

## Styling

Styling matters. Aim for a clean layout, clear labels and readable charts; it does not need to be pixel-perfect.

## Not required

A date range filter, a campaign filter, more than one chart, or live API connections.
Live API design is a discussion topic on the technical call (see the brief).

## Submission checklist

Within 5 days, send the items below using the instructions in the email that sent you this exercise. Please check that we can open every link without requesting access.

- [ ] **Code:** repo link preferred (shared with us if private), or a zip without dependency folders such as `node_modules`. Runs locally from your README in under 5 minutes. Approximate time spent at the top of the README.
- [ ] **Design doc, one page:** data model, how you normalized the sources and why, how you matched campaigns, what you cut, what you would change first at 50 clients.
- [ ] **Recap video, 5 minutes or less:** show the dashboard and one initiative across all three channels, then the decision you are most proud of and the one you would revisit. Any recorder: QuickTime (Mac), Clipchamp or Xbox Game Bar (Windows), OBS, or Loom. Share as a link (Google Drive, Dropbox, unlisted YouTube, Loom) or upload the video file.
- [ ] **AI transcript:** export of your full AI conversation, including your prompts (for example Cursor's chat export, Claude Code's `/export`, or a ChatGPT or Claude share link). Markdown, text or PDF is ideal. **Remove anything private first:** API keys, passwords, tokens, `.env` contents, personal details, and any code or information from current or past employers (replace with `[removed]`). No chat or agent tool? Write a short paragraph on how you worked instead.

## Ownership

This is an exercise only. We will not use your code or ideas in our product, and you keep ownership of everything you build.

## Questions

Reply to the email that sent you this exercise. We respond within one business day. If you have to make an assumption, write it down in your design doc and keep going.

## Build decisions

### Campaigns are built after normalization, not inside each platform loader

The campaign list (`buildCampaigns` in `addPlatformDemo/src/lib/campaigns.ts`) is derived from normalized rows
in one pass, rather than collected inside each of the three platform loaders.

- **One implementation.** It only reads `externalCampaignId`, `campaignName` and `date`, which every normalized
  row has. Building it per loader would mean three copies of the same logic, with rules like
  "latest name wins after a rename" able to drift apart.
- **A fourth platform is just a loader.** A new source only has to emit `NormalizedRow`s; campaign building and
  matching work on it unchanged.
- **Loaders do one job.** Each loader maps raw platform data to normalized rows and nothing else, so its output
  can be checked directly against the raw file.
- **Cost.** One extra loop over ~1,150 rows, which is negligible. At production scale this becomes a single
  `GROUP BY` over the normalized table, which is the same design.

Revisit only if rows can no longer be held in memory (for example streaming a large backfill). Even then, the
fix is one shared collector fed from a single import loop, not campaign logic in each loader.

### In production, rows and campaigns live in a database

Here everything is rebuilt from the files on each load. In production both would be persisted so they can be
read directly instead of recomputed:

- **`normalized_rows`**: one row per `externalCampaignId` + `date`, upserted on each import so re-pulled days
  replace the old values.
- **`campaigns`**: one row per `externalCampaignId` with its current name, first/last seen dates and the
  assigned `internalCampaignId` and match status. Upserted from new rows after each import, so a campaign
  that has never been seen appears immediately as unmatched.
- **`internal_campaigns`** and **`campaign_overrides`**: what `src/config/` holds today, moved to tables so
  mappings can be edited without a deploy.
