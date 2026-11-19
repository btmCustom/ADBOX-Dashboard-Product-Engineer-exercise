import { describe, expect, it } from "vitest";
import type { Campaign } from "./campaigns";
import { normalizeCampaignName } from "./campaigns";
import { matchCampaigns } from "./matching";

const internals = [
  { id: "fall-rate-promo", name: "Fall Rate Promo", patterns: [/\bfall ?rate\b/, /\bfall promo\b/] },
  { id: "checking-account-launch", name: "Checking Account Launch", patterns: [/\b(checking|chk)( acct| account)? launch\b/] },
];

function campaign(id: string, name: string): Campaign {
  return { id, name, normalizedName: normalizeCampaignName(name) };
}

describe("matchCampaigns", () => {
  it("auto-matches a single pattern hit", () => {
    const [matched] = matchCampaigns([campaign("meta/1", "Fall Rate Promo - Prospecting")], internals, []);
    expect(matched).toMatchObject({
      matchStatus: "auto",
      internalCampaignId: "fall-rate-promo",
      candidates: ["fall-rate-promo"],
    });
  });

  it("marks multi-pattern hits as ambiguous", () => {
    const ambiguousInternals = [
      ...internals,
      { id: "fall-and-checking", name: "Both", patterns: [/\bfall\b/, /\bchecking launch\b/] },
    ];
    const [matched] = matchCampaigns(
      [campaign("meta/9", "Fall Rate Checking Launch Combo")],
      ambiguousInternals,
      [],
    );
    expect(matched.matchStatus).toBe("ambiguous");
    expect(matched.internalCampaignId).toBeNull();
    expect(matched.candidates.length).toBeGreaterThan(1);
  });

  it("leaves non-matches unmatched", () => {
    const [matched] = matchCampaigns([campaign("meta/2", "Brand Awareness Q3")], internals, []);
    expect(matched).toMatchObject({ matchStatus: "unmatched", internalCampaignId: null, candidates: [] });
  });

  it("applies manual overrides over patterns", () => {
    const [matched] = matchCampaigns(
      [campaign("meta/28637003708194310", "Fal Rate Promo - Lookalike")],
      internals,
      [{ externalCampaignId: "meta/28637003708194310", internalCampaignId: "fall-rate-promo", reason: "typo" }],
    );
    expect(matched).toMatchObject({ matchStatus: "manual", internalCampaignId: "fall-rate-promo" });
  });

  it("rejects overrides that point at unknown initiatives", () => {
    expect(() =>
      matchCampaigns([campaign("meta/1", "x")], internals, [
        { externalCampaignId: "meta/1", internalCampaignId: "does-not-exist", reason: "bad" },
      ]),
    ).toThrow(/unknown does-not-exist/);
  });
});
