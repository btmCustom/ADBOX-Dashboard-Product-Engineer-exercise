import { CAMPAIGN_OVERRIDES, type CampaignOverride } from "@/config/campaignOverrides";
import { INTERNAL_CAMPAIGNS, type InternalCampaign } from "@/config/internalCampaigns";
import type { Campaign } from "./campaigns";

export type MatchStatus = "auto" | "manual" | "ambiguous" | "unmatched";

export interface MatchedCampaign extends Campaign {
  internalCampaignId: string | null; // null when ambiguous or unmatched
  matchStatus: MatchStatus;
  candidates: string[]; // internal campaign IDs whose patterns matched the name
}

export function matchCampaigns(
  campaigns: Campaign[],
  internalCampaigns: InternalCampaign[] = INTERNAL_CAMPAIGNS,
  overrides: CampaignOverride[] = CAMPAIGN_OVERRIDES,
): MatchedCampaign[] {
  const knownIds = new Set(internalCampaigns.map((ic) => ic.id));
  const overrideById = new Map(overrides.map((o) => [o.externalCampaignId, o]));
  for (const o of overrides) {
    if (!knownIds.has(o.internalCampaignId)) {
      throw new Error(`Override for ${o.externalCampaignId} points to unknown ${o.internalCampaignId}`);
    }
  }

  return campaigns.map((campaign) => {
    const candidates = internalCampaigns
      .filter((ic) => ic.patterns.some((p) => p.test(campaign.normalizedName)))
      .map((ic) => ic.id);

    const override = overrideById.get(campaign.id);
    if (override) {
      return { ...campaign, internalCampaignId: override.internalCampaignId, matchStatus: "manual", candidates };
    }
    if (candidates.length === 1) {
      return { ...campaign, internalCampaignId: candidates[0], matchStatus: "auto", candidates };
    }
    const matchStatus = candidates.length > 1 ? "ambiguous" : "unmatched";
    return { ...campaign, internalCampaignId: null, matchStatus, candidates };
  });
}
