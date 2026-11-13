"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
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

const COLOR = "#0369a1";

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
      <h3 className="mb-3 text-sm font-medium text-zinc-700">
        {metric.label} by {DIMENSIONS.find((d) => d.value === dimension)!.label.toLowerCase()}
      </h3>

      {points.length === 0 ? (
        <EmptyState title="Nothing to chart" detail="No rows match the current filters." />
      ) : isTime ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e4e4e7" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717a" }} minTickGap={24} />
            <YAxis
              tickFormatter={metric.axisFormat}
              tick={{ fontSize: 12, fill: "#71717a" }}
              width={72}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e4e4e7",
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
        <ResponsiveContainer width="100%" height={Math.max(160, points.length * 36 + 32)}>
          <BarChart data={points} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="#e4e4e7" />
            <XAxis
              type="number"
              tickFormatter={metric.axisFormat}
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={dimension === "campaign" ? 280 : 180}
              tick={{ fontSize: 12, fill: "#3f3f46" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ fill: "#f4f4f5" }}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e4e4e7",
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="value"
              fill={COLOR}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              label={{
                position: "right",
                fontSize: 12,
                fill: "#52525b",
                formatter: (v: unknown) => (typeof v === "number" ? metric.format(v) : ""),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
