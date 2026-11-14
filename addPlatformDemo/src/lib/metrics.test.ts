import { describe, expect, it } from "vitest";
import { metrics } from "@/test/fixtures";
import {
  formatMetric,
  groupTotals,
  METRIC_BY_KEY,
  sumRows,
  totalsMatch,
} from "./metrics";

describe("rate metrics", () => {
  it("computes CPC, CPM, CPA, and ROAS from summed totals", () => {
    const t = metrics({ spend: 100, impressions: 10_000, clicks: 50, conversions: 10, conversionValue: 250 });
    expect(METRIC_BY_KEY.cpc.value(t)).toBeCloseTo(2);
    expect(METRIC_BY_KEY.cpm.value(t)).toBeCloseTo(10);
    expect(METRIC_BY_KEY.cpa.value(t)).toBeCloseTo(10);
    expect(METRIC_BY_KEY.roas.value(t)).toBeCloseTo(2.5);
  });

  it("returns null when the denominator is zero", () => {
    const empty = metrics({ spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 });
    expect(METRIC_BY_KEY.cpc.value(empty)).toBeNull();
    expect(METRIC_BY_KEY.cpm.value(empty)).toBeNull();
    expect(METRIC_BY_KEY.cpa.value(empty)).toBeNull();
    expect(METRIC_BY_KEY.roas.value(empty)).toBeNull();
  });

  it("never averages rates across rows", () => {
    const a = metrics({ spend: 100, clicks: 10, conversions: 1, conversionValue: 50, impressions: 1000 });
    const b = metrics({ spend: 300, clicks: 90, conversions: 9, conversionValue: 450, impressions: 9000 });
    const combined = sumRows([a, b]);
    expect(METRIC_BY_KEY.cpc.value(combined)).toBeCloseTo(4); // 400/100, not avg(10, 3.33)
    expect(METRIC_BY_KEY.roas.value(combined)).toBeCloseTo(1.25); // 500/400
  });
});

describe("sumRows / groupTotals / totalsMatch", () => {
  it("sums additive fields", () => {
    expect(sumRows([metrics({ spend: 10 }), metrics({ spend: 15 })])).toMatchObject({ spend: 25 });
  });

  it("groups by key and reconciles to the ungrouped sum", () => {
    const rows = [
      { ...metrics({ spend: 10 }), key: "a" },
      { ...metrics({ spend: 20 }), key: "b" },
      { ...metrics({ spend: 5 }), key: "a" },
    ];
    const grouped = groupTotals(rows, (r) => r.key);
    expect(grouped.get("a")?.spend).toBe(15);
    expect(grouped.get("b")?.spend).toBe(20);
    expect(totalsMatch(sumRows([...grouped.values()]), sumRows(rows))).toBe(true);
  });

  it("tolerates tiny floating-point drift", () => {
    expect(totalsMatch(metrics({ spend: 1 }), metrics({ spend: 1 + 1e-10 }))).toBe(true);
    expect(totalsMatch(metrics({ spend: 1 }), metrics({ spend: 1.01 }))).toBe(false);
  });
});

describe("formatMetric", () => {
  it("formats values and uses an em dash for null rates", () => {
    expect(formatMetric(METRIC_BY_KEY.spend, metrics({ spend: 1234 }))).toContain("1,234");
    expect(formatMetric(METRIC_BY_KEY.cpc, metrics({ spend: 10, clicks: 0 }))).toBe("—");
  });
});
