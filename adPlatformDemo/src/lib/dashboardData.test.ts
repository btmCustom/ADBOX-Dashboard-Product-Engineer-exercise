import { describe, expect, it } from "vitest";
import { buildCampaigns } from "./campaigns";
import { loadDashboardData } from "./dashboardData";
import { loadAllRows } from "./ingest";
import { groupTotals, sumRows, totalsMatch } from "./metrics";

describe("loadDashboardData", () => {
  const data = loadDashboardData();

  it("covers every row with a dashboard campaign", () => {
    const ids = new Set(data.dashboardCampaigns.map((c) => c.id));
    for (const row of data.rows) {
      expect(ids.has(row.externalCampaignId)).toBe(true);
    }
    expect(data.campaigns).toHaveLength(buildCampaigns(loadAllRows()).length);
  });

  it("surfaces auto, manual, ambiguous, and unmatched statuses", () => {
    const statuses = new Set(data.campaigns.map((c) => c.matchStatus));
    expect(statuses.has("auto")).toBe(true);
    expect(statuses.has("manual")).toBe(true);
    expect(statuses.has("ambiguous")).toBe(true);
    expect(statuses.has("unmatched")).toBe(true);
  });

  it("reconciles initiative + review groups to the grand total", () => {
    const byGroup = groupTotals(data.rows, (r) => {
      const campaign = data.dashboardCampaigns.find((c) => c.id === r.externalCampaignId)!;
      return campaign.groupKey;
    });
    expect(totalsMatch(sumRows([...byGroup.values()]), sumRows(data.rows))).toBe(true);
  });

  it("includes Ambiguous and Unmatched report groups", () => {
    expect(data.groups.map((g) => g.key)).toEqual(
      expect.arrayContaining(["ambiguous", "unmatched", "fall-rate-promo"]),
    );
  });
});
