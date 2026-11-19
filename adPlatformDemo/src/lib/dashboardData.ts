import { INTERNAL_CAMPAIGNS } from "@/config/internalCampaigns";
import { buildCampaigns } from "./campaigns";
import { channelOf, type Channel } from "./channels";
import { buildReportGroups, reportGroupKey, type ReportGroup } from "./groups";
import { loadAllRows, type NormalizedRow } from "./ingest";
import { matchCampaigns, type MatchedCampaign } from "./matching";

// What the interactive dashboard needs per campaign; serializable so it can be passed to client components.
export interface DashboardCampaign {
  id: string;
  name: string;
  channel: Channel;
  groupKey: string;
}

export interface DashboardData {
  rows: NormalizedRow[];
  campaigns: MatchedCampaign[];
  internalCampaigns: { id: string; name: string }[];
  groups: ReportGroup[];
  dashboardCampaigns: DashboardCampaign[];
}

export function loadDashboardData(): DashboardData {
  const rows = loadAllRows();
  const campaigns = matchCampaigns(buildCampaigns(rows));
  const internalCampaigns = INTERNAL_CAMPAIGNS.map(({ id, name }) => ({ id, name }));
  return {
    rows,
    campaigns,
    internalCampaigns,
    groups: buildReportGroups(internalCampaigns),
    dashboardCampaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      channel: channelOf(c.id),
      groupKey: reportGroupKey(c),
    })),
  };
}
