import { describe, expect, it } from "vitest";
import { buildReportGroups, reportGroupKey } from "./groups";

describe("reportGroupKey", () => {
  it("uses the internal id when matched", () => {
    expect(reportGroupKey({ internalCampaignId: "fall-rate-promo", matchStatus: "auto" })).toBe("fall-rate-promo");
    expect(reportGroupKey({ internalCampaignId: "fall-rate-promo", matchStatus: "manual" })).toBe("fall-rate-promo");
  });

  it("buckets review statuses without an internal id", () => {
    expect(reportGroupKey({ internalCampaignId: null, matchStatus: "ambiguous" })).toBe("ambiguous");
    expect(reportGroupKey({ internalCampaignId: null, matchStatus: "unmatched" })).toBe("unmatched");
  });
});

describe("buildReportGroups", () => {
  it("lists initiatives then Ambiguous and Unmatched", () => {
    expect(buildReportGroups([{ id: "a", name: "A" }, { id: "b", name: "B" }])).toEqual([
      { key: "a", label: "A", kind: "initiative" },
      { key: "b", label: "B", kind: "initiative" },
      { key: "ambiguous", label: "Ambiguous", kind: "ambiguous" },
      { key: "unmatched", label: "Unmatched", kind: "unmatched" },
    ]);
  });
});
