"use client";

import { useMemo, useState } from "react";
import { CHANNEL_LABEL, CHANNELS, type Channel } from "@/lib/channels";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { NormalizedRow } from "@/lib/ingest";
import { formatMetric, METRIC_BY_KEY, sumRows, type MetricKey } from "@/lib/metrics";
import { MetricChart } from "./MetricChart";
import { TotalsTable } from "./TotalsTable";
import { Panel, Select } from "./ui";

const KPIS: MetricKey[] = ["spend", "conversions", "cpa", "roas"];

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

  return (
    <>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KPIS.map((key) => (
          <div key={key} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">{METRIC_BY_KEY[key].label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {formatMetric(METRIC_BY_KEY[key], totals)}
            </div>
          </div>
        ))}
      </div>

      <Panel title="Performance">
        <MetricChart rows={filteredRows} campaignOf={campaignOf} groups={visibleGroups} />
      </Panel>

      <Panel title="Totals by initiative and channel">
        <TotalsTable rows={filteredRows} campaignOf={campaignOf} groups={visibleGroups} />
      </Panel>
    </>
  );
}
