import { describe, expect, it } from "vitest";
import { loadAllRows, loadAmazon, loadGoogle, loadMeta, META_CONVERSION_ACTION } from "./ingest";

describe("platform loaders", () => {
  it("normalizes Meta rows with lead conversions only", () => {
    const rows = loadMeta();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toMatchObject({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      externalCampaignId: expect.stringMatching(/^meta\//),
    });
    expect(META_CONVERSION_ACTION).toBe("lead");
    for (const row of rows) {
      expect(row.spend).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(row.conversions)).toBe(true);
    }
  });

  it("converts Google cost micros to USD", () => {
    const rows = loadGoogle();
    expect(rows[0].externalCampaignId).toMatch(/^gads\//);
    // First fixture row: 221200000 micros = $221.20
    const first = rows.find((r) => r.externalCampaignId === "gads/43800084505" && r.date === "2026-08-01");
    expect(first?.spend).toBeCloseTo(221.2);
    expect(first?.campaignName).toBe("FALL_RATE_PROMO_Search_Brand");
  });

  it("parses Amazon US dates and off-Amazon 14d conversions", () => {
    const rows = loadAmazon();
    const first = rows.find((r) => r.externalCampaignId === "amzn/3779101165048" && r.date === "2026-08-01");
    expect(first).toMatchObject({
      date: "2026-08-01",
      spend: 191.79,
      clicks: 76,
      conversions: 1,
      conversionValue: 340.14,
    });
  });

  it("loads all three sources into one row list", () => {
    const rows = loadAllRows();
    const prefixes = new Set(rows.map((r) => r.externalCampaignId.split("/")[0]));
    expect(prefixes).toEqual(new Set(["meta", "gads", "amzn"]));
    expect(rows.length).toBe(loadMeta().length + loadGoogle().length + loadAmazon().length);
  });
});
