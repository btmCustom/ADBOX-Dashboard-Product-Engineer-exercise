import type { Metrics } from "./ingest";

export type MetricKey =
  | "spend"
  | "impressions"
  | "clicks"
  | "conversions"
  | "conversionValue"
  | "cpc"
  | "cpm"
  | "cpa"
  | "roas";

export interface MetricDef {
  key: MetricKey;
  label: string;
  // Rate metrics are derived from summed totals at the grouping shown, never averaged.
  value: (t: Metrics) => number | null;
  format: (v: number) => string;
  axisFormat: (v: number) => string;
}

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdCompact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact" });
const multiple = (v: number) => `${v.toFixed(2)}×`;

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

export const METRICS: MetricDef[] = [
  { key: "spend", label: "Spend", value: (t) => t.spend, format: usd0.format, axisFormat: usdCompact.format },
  { key: "impressions", label: "Impressions", value: (t) => t.impressions, format: int.format, axisFormat: compact.format },
  { key: "clicks", label: "Clicks", value: (t) => t.clicks, format: int.format, axisFormat: compact.format },
  { key: "conversions", label: "Conversions", value: (t) => t.conversions, format: int.format, axisFormat: compact.format },
  {
    key: "conversionValue",
    label: "Conv. value",
    value: (t) => t.conversionValue,
    format: usd0.format,
    axisFormat: usdCompact.format,
  },
  { key: "cpc", label: "CPC", value: (t) => ratio(t.spend, t.clicks), format: usd2.format, axisFormat: usd2.format },
  {
    key: "cpm",
    label: "CPM",
    value: (t) => ratio(t.spend * 1000, t.impressions),
    format: usd2.format,
    axisFormat: usd2.format,
  },
  { key: "cpa", label: "CPA", value: (t) => ratio(t.spend, t.conversions), format: usd2.format, axisFormat: usd2.format },
  { key: "roas", label: "ROAS", value: (t) => ratio(t.conversionValue, t.spend), format: multiple, axisFormat: multiple },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, MetricDef>;

export function formatMetric(def: MetricDef, totals: Metrics): string {
  const v = def.value(totals);
  return v === null ? "—" : def.format(v);
}

export function emptyTotals(): Metrics {
  return { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 };
}

export function addInto(totals: Metrics, row: Metrics): Metrics {
  totals.spend += row.spend;
  totals.impressions += row.impressions;
  totals.clicks += row.clicks;
  totals.conversions += row.conversions;
  totals.conversionValue += row.conversionValue;
  return totals;
}

export function sumRows(rows: Metrics[]): Metrics {
  return rows.reduce(addInto, emptyTotals());
}

export function groupTotals<R extends Metrics>(rows: R[], keyOf: (row: R) => string): Map<string, Metrics> {
  const groups = new Map<string, Metrics>();
  for (const row of rows) {
    const key = keyOf(row);
    addInto(groups.get(key) ?? groups.set(key, emptyTotals()).get(key)!, row);
  }
  return groups;
}

const SUMMED: (keyof Metrics)[] = ["spend", "impressions", "clicks", "conversions", "conversionValue"];

// Floating-point sums of the same rows in a different order can differ by a few ulps.
export function totalsMatch(a: Metrics, b: Metrics): boolean {
  return SUMMED.every((k) => Math.abs(a[k] - b[k]) <= 1e-6 * Math.max(1, Math.abs(a[k]), Math.abs(b[k])));
}
