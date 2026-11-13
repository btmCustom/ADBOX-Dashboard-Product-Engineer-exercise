"use client";

import { useMemo, useState } from "react";
import { CHANNEL_LABEL, CHANNELS, type Channel } from "@/lib/channels";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { Metrics, NormalizedRow } from "@/lib/ingest";
import {
  formatMetric,
  groupTotals,
  METRIC_BY_KEY,
  METRICS,
  sumRows,
  totalsMatch,
  type MetricKey,
} from "@/lib/metrics";
import { Badge } from "./ui";

interface Props {
  rows: NormalizedRow[];
  campaignOf: (externalCampaignId: string) => DashboardCampaign;
  groups: ReportGroup[];
}

type SortKey = "label" | MetricKey;
type SortDir = "asc" | "desc";

function MetricCells({ totals }: { totals: Metrics }) {
  return METRICS.map((m) => (
    <td key={m.key} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-700">
      {formatMetric(m, totals)}
    </td>
  ));
}

function metricValue(totals: Metrics, key: MetricKey): number | null {
  return METRIC_BY_KEY[key].value(totals);
}

function compareValues(a: number | null, b: number | null, dir: SortDir): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === "asc" ? a - b : b - a;
}

function SortHeader({
  label,
  column,
  sort,
  align = "right",
  onSort,
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; dir: SortDir };
  align?: "left" | "right";
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === column;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th
      className={`whitespace-nowrap px-3 py-3 text-xs font-medium tracking-wide text-gray-500 uppercase ${
        align === "left" ? "text-left" : "text-right"
      }`}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-gray-100 hover:text-gray-700 focus:ring-4 focus:ring-brand-100 focus:outline-none ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-gray-700" : ""}`}
      >
        {label}
        <span aria-hidden className={`w-3 text-center text-[10px] ${active ? "text-brand-600" : "text-gray-300"}`}>
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "◇"}
        </span>
      </button>
    </th>
  );
}

export function TotalsTable({ rows, campaignOf, groups }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "spend", dir: "desc" });

  const isOpen = (key: string) => open[key] ?? false;
  const toggle = (key: string) => setOpen((prev) => ({ ...prev, [key]: !isOpen(key) }));

  const onSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { key, dir: key === "label" ? "asc" : "desc" },
    );
  };

  const { sections, grandTotal } = useMemo(() => {
    const byGroup = groupTotals(rows, (r) => campaignOf(r.externalCampaignId).groupKey);
    const byGroupChannel = groupTotals(rows, (r) => {
      const campaign = campaignOf(r.externalCampaignId);
      return `${campaign.groupKey}|${campaign.channel}`;
    });

    const built = groups
      .filter((g) => byGroup.has(g.key))
      .map((group) => {
        const channels = CHANNELS.filter((ch) => byGroupChannel.has(`${group.key}|${ch}`)).map((channel) => ({
          channel,
          total: byGroupChannel.get(`${group.key}|${channel}`)!,
        }));
        channels.sort((a, b) => {
          if (sort.key === "label") {
            const cmp = CHANNEL_LABEL[a.channel].localeCompare(CHANNEL_LABEL[b.channel]);
            return sort.dir === "asc" ? cmp : -cmp;
          }
          return compareValues(metricValue(a.total, sort.key), metricValue(b.total, sort.key), sort.dir);
        });
        return { group, total: byGroup.get(group.key)!, channels };
      });

    built.sort((a, b) => {
      if (sort.key === "label") {
        const cmp = a.group.label.localeCompare(b.group.label);
        return sort.dir === "asc" ? cmp : -cmp;
      }
      return compareValues(metricValue(a.total, sort.key), metricValue(b.total, sort.key), sort.dir);
    });

    return { sections: built, grandTotal: sumRows(rows) };
  }, [rows, campaignOf, groups, sort]);

  const channelsReconcile = sections.every((s) => totalsMatch(sumRows(s.channels.map((c) => c.total)), s.total));
  const groupsReconcile = totalsMatch(sumRows(sections.map((s) => s.total)), grandTotal);
  const reconciles = channelsReconcile && groupsReconcile;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <SortHeader label="Initiative / channel" column="label" sort={sort} align="left" onSort={onSort} />
              {METRICS.map((m) => (
                <SortHeader key={m.key} label={m.label} column={m.key} sort={sort} onSort={onSort} />
              ))}
            </tr>
          </thead>
          {sections.map(({ group, total, channels }) => {
            const expanded = isOpen(group.key);
            const label =
              group.kind === "ambiguous" ? (
                <Badge tone="warning">{group.label}</Badge>
              ) : group.kind === "unmatched" ? (
                <Badge tone="gray">{group.label}</Badge>
              ) : (
                <span className="font-semibold text-gray-900">{group.label}</span>
              );

            return (
              <tbody key={group.key} className="border-b border-gray-200">
                <tr className="bg-gray-25">
                  <td className="whitespace-nowrap py-3 pr-3">
                    {channels.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggle(group.key)}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-2 text-left hover:text-gray-700 focus:ring-4 focus:ring-brand-100 focus:outline-none"
                      >
                        <span
                          aria-hidden
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-transform ${
                            expanded ? "rotate-90" : ""
                          }`}
                        >
                          ▸
                        </span>
                        {label}
                        <span className="text-xs font-normal text-gray-500">
                          ({channels.length === 1 ? "1 channel" : `${channels.length} channels`})
                        </span>
                      </button>
                    ) : (
                      label
                    )}
                  </td>
                  <MetricCells totals={total} />
                </tr>
                {expanded &&
                  channels.map(({ channel, total: channelTotal }: { channel: Channel; total: Metrics }) => (
                    <tr key={channel} className="text-gray-600 hover:bg-gray-50">
                      <td className="whitespace-nowrap py-3 pl-10 pr-3">{CHANNEL_LABEL[channel]}</td>
                      <MetricCells totals={channelTotal} />
                    </tr>
                  ))}
              </tbody>
            );
          })}
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold text-gray-900">
              <td className="py-3.5 pr-3">Grand total</td>
              <MetricCells totals={grandTotal} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`mt-4 text-sm ${reconciles ? "text-success-700" : "font-medium text-error-700"}`}>
        {reconciles
          ? "✓ Channel rows sum to each group, and groups sum to the grand total."
          : `Totals do not reconcile: ${channelsReconcile ? "" : "channel rows ≠ group totals. "}${
              groupsReconcile ? "" : "groups ≠ grand total."
            }`}
      </p>
    </div>
  );
}
