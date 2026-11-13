"use client";

import { useMemo, useState } from "react";
import { CHANNEL_LABEL, CHANNELS, type Channel } from "@/lib/channels";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { NormalizedRow } from "@/lib/ingest";
import { formatMetric, METRICS, sumRows } from "@/lib/metrics";
import { MetricChart } from "./MetricChart";
import { TotalsTable } from "./TotalsTable";
import { EmptyState, Panel, Select } from "./ui";

type ChannelFilter = "all" | Channel;
type InitiativeFilter = "all" | string;

interface Props {
  rows: NormalizedRow[];
  campaigns: DashboardCampaign[];
  groups: ReportGroup[];
}

export function Dashboard({ rows, campaigns, groups }: Props) {
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [initiative, setInitiative] = useState<InitiativeFilter>("all");

  const campaignOf = useMemo(() => {
    const byId = new Map(campaigns.map((c) => [c.id, c]));
    return (externalCampaignId: string) => {
      const campaign = byId.get(externalCampaignId);
      if (!campaign) throw new Error(`Row references unknown campaign ${externalCampaignId}`);
      return campaign;
    };
  }, [campaigns]);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const campaign = campaignOf(r.externalCampaignId);
        if (channel !== "all" && campaign.channel !== channel) return false;
        if (initiative !== "all" && campaign.groupKey !== initiative) return false;
        return true;
      }),
    [rows, campaignOf, channel, initiative],
  );

  const totals = useMemo(() => sumRows(filteredRows), [filteredRows]);
  const visibleGroups = initiative === "all" ? groups : groups.filter((g) => g.key === initiative);
  const filtersActive = channel !== "all" || initiative !== "all";
  const channelLabel = channel === "all" ? "All channels" : CHANNEL_LABEL[channel];
  const initiativeLabel =
    initiative === "all" ? "All initiatives" : (groups.find((g) => g.key === initiative)?.label ?? initiative);
  const clearFilters = () => {
    setChannel("all");
    setInitiative("all");
  };

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <Select
              label="Channel"
              value={channel}
              options={[
                { value: "all", label: "All channels" },
                ...CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })),
              ]}
              onChange={setChannel}
            />
            <Select
              label="Initiative"
              value={initiative}
              options={[
                { value: "all", label: "All initiatives" },
                ...groups.map((g) => ({ value: g.key, label: g.label })),
              ]}
              onChange={setInitiative}
            />
          </div>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg px-3 text-sm font-medium text-sky-700 hover:bg-sky-50 focus:ring-2 focus:ring-sky-600/20 focus:outline-none"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Showing <span className="font-medium text-zinc-700">{channelLabel}</span>
          {" · "}
          <span className="font-medium text-zinc-700">{initiativeLabel}</span>
          {filtersActive ? (
            <span className="text-zinc-400">
              {" "}
              ({filteredRows.length.toLocaleString()} of {rows.length.toLocaleString()} daily rows)
            </span>
          ) : null}
        </p>
      </section>

      {filteredRows.length === 0 ? (
        <EmptyState
          title="No data for these filters"
          detail="Try another channel or initiative, or clear the filters to see the full period."
        />
      ) : (
        <>
          <section aria-label="Headline metrics">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {metric.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums text-zinc-900 sm:text-2xl">
                    {formatMetric(metric, totals)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Panel title="Performance" description="Pick a metric and how to break it out.">
            <MetricChart rows={filteredRows} campaignOf={campaignOf} groups={visibleGroups} />
          </Panel>

          <Panel
            title="Totals by initiative and channel"
            description="Click a column header to sort. Expand a row to see channels."
          >
            <TotalsTable rows={filteredRows} campaignOf={campaignOf} groups={visibleGroups} />
          </Panel>
        </>
      )}
    </>
  );
}
