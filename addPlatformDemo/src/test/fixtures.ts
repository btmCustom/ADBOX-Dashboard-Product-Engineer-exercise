import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { NormalizedRow } from "@/lib/ingest";
import type { Metrics } from "@/lib/ingest";

export const metrics = (partial: Partial<Metrics> = {}): Metrics => ({
  spend: 100,
  impressions: 1000,
  clicks: 50,
  conversions: 10,
  conversionValue: 200,
  ...partial,
});

export const row = (partial: Partial<NormalizedRow> = {}): NormalizedRow => ({
  date: "2026-08-01",
  externalCampaignId: "meta/1",
  campaignName: "Fall Rate Promo - Prospecting",
  ...metrics(),
  ...partial,
});

export const groups: ReportGroup[] = [
  { key: "fall-rate-promo", label: "Fall Rate Promo", kind: "initiative" },
  { key: "checking-account-launch", label: "Checking Account Launch", kind: "initiative" },
  { key: "ambiguous", label: "Ambiguous", kind: "ambiguous" },
  { key: "unmatched", label: "Unmatched", kind: "unmatched" },
];

export const dashboardCampaigns: DashboardCampaign[] = [
  { id: "meta/1", name: "Fall Rate Promo - Prospecting", channel: "meta", groupKey: "fall-rate-promo" },
  { id: "gads/2", name: "FALL_RATE_PROMO_Search_Brand", channel: "google", groupKey: "fall-rate-promo" },
  { id: "amzn/3", name: "fallrate-display-Q3-26", channel: "amazon", groupKey: "fall-rate-promo" },
  { id: "meta/4", name: "Checking Launch - Conversions", channel: "meta", groupKey: "checking-account-launch" },
  { id: "meta/5", name: "Brand Awareness Q3", channel: "meta", groupKey: "unmatched" },
];
