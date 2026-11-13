import type { NormalizedRow } from "./ingest";

export interface Campaign {
  id: string; // externalCampaignId, e.g. "gads/43800084505"
  name: string; // as named on the platform
  normalizedName: string; // lowercase words, e.g. "fall rate promo search brand"
}

// "FallRatePromo_Search" and "FALL_RATE_PROMO-Search" both become "fall rate promo search".
export function normalizeCampaignName(name: string): string {
  return name
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z\d]+/g, " ")
    .trim();
}

// One entry per externalCampaignId. If a campaign was renamed, the name on its latest date wins.
export function buildCampaigns(rows: NormalizedRow[]): Campaign[] {
  const latest = new Map<string, { name: string; date: string }>();
  for (const row of rows) {
    const seen = latest.get(row.externalCampaignId);
    if (!seen || row.date > seen.date) {
      latest.set(row.externalCampaignId, { name: row.campaignName, date: row.date });
    }
  }
  return [...latest]
    .map(([id, { name }]) => ({ id, name, normalizedName: normalizeCampaignName(name) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
