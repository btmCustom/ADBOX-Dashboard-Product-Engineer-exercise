export interface CampaignOverride {
  externalCampaignId: string;
  internalCampaignId: string;
  reason: string;
}

// Takes precedence over pattern matching. Keyed by ID so a platform rename does not break the mapping.
export const CAMPAIGN_OVERRIDES: CampaignOverride[] = [
  {
    externalCampaignId: "meta/28637003708194310",
    internalCampaignId: "fall-rate-promo",
    reason: 'Typo in platform name: "Fal Rate Promo - Lookalike"',
  },
];
