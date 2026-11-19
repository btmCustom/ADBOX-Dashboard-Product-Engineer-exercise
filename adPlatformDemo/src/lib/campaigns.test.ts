import { describe, expect, it } from "vitest";
import { buildCampaigns, normalizeCampaignName } from "./campaigns";
import { row } from "@/test/fixtures";

describe("normalizeCampaignName", () => {
  it.each([
    ["FallRatePromo_Search", "fall rate promo search"],
    ["FALL_RATE_PROMO-Search", "fall rate promo search"],
    ["HPB | Checking Launch | Conversions", "hpb checking launch conversions"],
    ["Fal Rate Promo - Lookalike", "fal rate promo lookalike"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCampaignName(input)).toBe(expected);
  });
});

describe("buildCampaigns", () => {
  it("keeps one campaign per id and uses the latest name", () => {
    const campaigns = buildCampaigns([
      row({ externalCampaignId: "meta/1", campaignName: "Old Name", date: "2026-08-01" }),
      row({ externalCampaignId: "meta/1", campaignName: "New Name", date: "2026-09-01" }),
      row({ externalCampaignId: "gads/2", campaignName: "Google Only", date: "2026-08-15" }),
    ]);

    expect(campaigns).toEqual([
      { id: "gads/2", name: "Google Only", normalizedName: "google only" },
      { id: "meta/1", name: "New Name", normalizedName: "new name" },
    ]);
  });
});
