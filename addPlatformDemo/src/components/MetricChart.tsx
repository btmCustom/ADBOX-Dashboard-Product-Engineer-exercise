"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHANNEL_LABEL, CHANNELS } from "@/lib/channels";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { NormalizedRow } from "@/lib/ingest";
import { groupTotals, METRIC_BY_KEY, METRICS, type MetricDef, type MetricKey } from "@/lib/metrics";
import { EmptyState, Select } from "./ui";

type Dimension = "channel" | "initiative" | "campaign" | "day" | "week";

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "channel", label: "Channel" },
  { value: "initiative", label: "Initiative" },
  { value: "campaign", label: "Campaign" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
];

interface Point {
  label: string;
  value: number | null;
}

interface Props {
  rows: NormalizedRow[];
  campaignOf: (externalCampaignId: string) => DashboardCampaign;
  groups: ReportGroup[];
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const formatDay = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Weeks start on Monday.
function weekStart(iso: string): string {
  const dayOfWeek = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(iso, -dayOfWeek);
}

function chartPoints(
  rows: NormalizedRow[],
  campaignOf: Props["campaignOf"],
  groups: ReportGroup[],
  dimension: Dimension,
  metric: MetricDef,
): Point[] {
  const point = (label: string, totals: Parameters<MetricDef["value"]>[0]) => ({ label, value: metric.value(totals) });

  switch (dimension) {
    case "channel": {
      const totals = groupTotals(rows, (r) => campaignOf(r.externalCampaignId).channel);
      return CHANNELS.filter((c) => totals.has(c)).map((c) => point(CHANNEL_LABEL[c], totals.get(c)!));
    }
    case "initiative": {
      const totals = groupTotals(rows, (r) => campaignOf(r.externalCampaignId).groupKey);
      return groups.filter((g) => totals.has(g.key)).map((g) => point(g.label, totals.get(g.key)!));
    }
    case "campaign": {
      const totals = groupTotals(rows, (r) => r.externalCampaignId);
      return [...totals]
        .map(([id, t]) => point(campaignOf(id).name, t))
        .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    }
    case "day": {
      const totals = groupTotals(rows, (r) => r.date);
      return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([date, t]) => point(formatDay(date), t));
    }
    case "week": {
      const dates = rows.map((r) => r.date).sort();
      const [first, last] = [dates[0], dates[dates.length - 1]];
      const totals = groupTotals(rows, (r) => weekStart(r.date));
      return [...totals]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([start, t]) => {
          const from = start < first ? first : start;
          const end = addDays(start, 6);
          const to = end > last ? last : end;
          return point(`${formatDay(from)}–${formatDay(to)}`, t);
        });
    }
  }
}

const COLOR = "#7F56D9"; // Untitled UI brand-600

const MOBILE_LABEL_MAX = 28;

function displayLabel(label: string, maxChars: number | null) {
  if (maxChars == null || label.length <= maxChars) return label;
  return `${label.slice(0, maxChars - 1)}…`;
}

function RankedBars({ points, metric }: { points: Point[]; metric: MetricDef }) {
  const ranked = [...points].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const max = Math.max(0, ...ranked.map((p) => p.value ?? 0));

  return (
    <ul className="flex flex-col gap-3" role="list">
      {ranked.map((point) => {
        const widthPct = point.value == null || max === 0 ? 0 : (point.value / max) * 100;
        const short = displayLabel(point.label, MOBILE_LABEL_MAX);
        return (
          <li key={point.label} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm font-medium text-gray-700" title={point.label}>
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{point.label}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {point.value == null ? "—" : metric.format(point.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: COLOR }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MetricChart({ rows, campaignOf, groups }: Props) {
  const [metricKey, setMetricKey] = useState<MetricKey>("roas");
  const [dimension, setDimension] = useState<Dimension>("initiative");
  const metric = METRIC_BY_KEY[metricKey];
  const points = chartPoints(rows, campaignOf, groups, dimension, metric);
  const isTime = dimension === "day" || dimension === "week";
  const tooltipFormatter = (v: unknown) => [typeof v === "number" ? metric.format(v) : "—", metric.label];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Select
          label="Metric"
          value={metricKey}
          options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
          onChange={setMetricKey}
        />
        <Select label="Break out by" value={dimension} options={DIMENSIONS} onChange={setDimension} />
      </div>
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        {metric.label} by {DIMENSIONS.find((d) => d.value === dimension)!.label.toLowerCase()}
      </h3>

      {points.length === 0 ? (
        <EmptyState title="Nothing to chart" detail="No rows match the current filters." />
      ) : isTime ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#E4E7EC" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#667085" }} minTickGap={24} />
            <YAxis
              tickFormatter={metric.axisFormat}
              tick={{ fontSize: 12, fill: "#667085" }}
              width={72}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#E4E7EC",
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.1)",
                fontSize: 13,
              }}
            />
            <Line
              dataKey="value"
              stroke={COLOR}
              strokeWidth={2}
              dot={dimension === "week"}
              type="linear"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <RankedBars points={points} metric={metric} />
      )}
    </div>
  );
}
