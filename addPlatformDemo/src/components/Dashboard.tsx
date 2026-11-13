"use client";

import { useMemo } from "react";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { NormalizedRow } from "@/lib/ingest";
import { formatMetric, METRIC_BY_KEY, sumRows, type MetricKey } from "@/lib/metrics";
import { MetricChart } from "./MetricChart";
import { TotalsTable } from "./TotalsTable";
import { Panel, Placeholder } from "./ui";

const KPIS: MetricKey[] = ["spend", "conversions", "cpa", "roas"];

interface Props {
  rows: NormalizedRow[];
  campaigns: DashboardCampaign[];
  groups: ReportGroup[];
}

export function Dashboard({ rows, campaigns, groups }: Props) {
  const campaignOf = useMemo(() => {
    const byId = new Map(campaigns.map((c) => [c.id, c]));
    return (externalCampaignId: string) => {
      const campaign = byId.get(externalCampaignId);
      if (!campaign) throw new Error(`Row references unknown campaign ${externalCampaignId}`);
      return campaign;
    };
  }, [campaigns]);
  const totals = useMemo(() => sumRows(rows), [rows]);

  return (
    <>
      <div className="flex gap-3">
        <Placeholder label="Channel filter" height="h-10 w-48" />
        <Placeholder label="Initiative filter" height="h-10 w-48" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KPIS.map((key) => (
          <div key={key} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">{METRIC_BY_KEY[key].label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{formatMetric(METRIC_BY_KEY[key], totals)}</div>
          </div>
        ))}
      </div>

      <Panel title="Performance">
        <MetricChart rows={rows} campaignOf={campaignOf} groups={groups} />
      </Panel>

      <Panel title="Totals by initiative and channel">
        <TotalsTable rows={rows} campaignOf={campaignOf} groups={groups} />
      </Panel>
    </>
  );
}
