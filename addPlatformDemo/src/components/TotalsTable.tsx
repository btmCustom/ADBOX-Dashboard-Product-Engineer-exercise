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

interface Props {
  rows: NormalizedRow[];
  campaignOf: (externalCampaignId: string) => DashboardCampaign;
  groups: ReportGroup[];
}

type SortKey = "label" | MetricKey;
type SortDir = "asc" | "desc";

function MetricCells({ totals }: { totals: Metrics }) {
  return METRICS.map((m) => (
    <td key={m.key} className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
      {formatMetric(m, totals)}
    </td>
  ));
}

const GROUP_TAG: Record<ReportGroup["kind"], string | null> = {
  initiative: null,
  ambiguous: "bg-amber-50 text-amber-800",
  unmatched: "bg-zinc-100 text-zinc-600",
};

function metricValue(totals: Metrics, key: MetricKey): number | null {
  return METRIC_BY_KEY[key].value(totals);
}

function compareValues(a: number | null, b: number | null, dir: SortDir): number {
  // Missing rates (e.g. CPA with 0 conversions) always sort last.
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
      className={`whitespace-nowrap px-2 py-2 font-medium ${align === "left" ? "pr-3 text-left" : "text-right"}`}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-800 ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-zinc-800" : ""}`}
      >
        {label}
        <span aria-hidden className="w-3 text-center text-[10px] text-zinc-400">
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

  // Group totals and the grand total are summed from rows independently of the channel breakdown,
  // so the reconciliation check below compares independent sums rather than restating one.
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
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <SortHeader label="Initiative / channel" column="label" sort={sort} align="left" onSort={onSort} />
              {METRICS.map((m) => (
                <SortHeader key={m.key} label={m.label} column={m.key} sort={sort} onSort={onSort} />
              ))}
            </tr>
          </thead>
          {sections.map(({ group, total, channels }) => {
            const expanded = isOpen(group.key);
            const label = GROUP_TAG[group.kind] ? (
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${GROUP_TAG[group.kind]}`}>
                {group.label}
              </span>
            ) : (
              group.label
            );

            return (
              <tbody key={group.key} className="border-b border-zinc-200">
                <tr className="bg-zinc-50 font-medium">
                  <td className="whitespace-nowrap py-2 pr-3">
                    {channels.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggle(group.key)}
                        aria-expanded={expanded}
                        className="inline-flex items-center gap-1.5 text-left hover:text-zinc-700"
                      >
                        <span
                          aria-hidden
                          className={`inline-block text-zinc-400 transition-transform ${expanded ? "rotate-90" : ""}`}
                        >
                          ▸
                        </span>
                        {label}
                        <span className="text-xs font-normal text-zinc-400">
                          ({channels.length} channel{channels.length === 1 ? "" : "s"})
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
                    <tr key={channel} className="text-zinc-600">
                      <td className="whitespace-nowrap py-2 pl-7 pr-3">{CHANNEL_LABEL[channel]}</td>
                      <MetricCells totals={channelTotal} />
                    </tr>
                  ))}
              </tbody>
            );
          })}
          <tfoot>
            <tr className="border-t-2 border-zinc-300 font-semibold">
              <td className="py-2 pr-3">Grand total</td>
              <MetricCells totals={grandTotal} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`mt-3 text-xs ${reconciles ? "text-emerald-700" : "font-medium text-red-700"}`}>
        {reconciles
          ? "✓ Channel rows sum to each group, and groups sum to the grand total."
          : `Totals do not reconcile: ${channelsReconcile ? "" : "channel rows ≠ group totals. "}${
              groupsReconcile ? "" : "groups ≠ grand total."
            }`}
      </p>
    </div>
  );
}
