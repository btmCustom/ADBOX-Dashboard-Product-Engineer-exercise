import { INTERNAL_CAMPAIGNS } from "@/config/internalCampaigns";
import { buildCampaigns } from "./campaigns";
import { loadAllRows, type NormalizedRow } from "./ingest";
import { matchCampaigns, type MatchedCampaign } from "./matching";

export interface DashboardData {
  rows: NormalizedRow[];
  campaigns: MatchedCampaign[];
  internalCampaigns: { id: string; name: string }[];
}

export function loadDashboardData(): DashboardData {
  const rows = loadAllRows();
  return {
    rows,
    campaigns: matchCampaigns(buildCampaigns(rows)),
    internalCampaigns: INTERNAL_CAMPAIGNS.map(({ id, name }) => ({ id, name })),
  };
}
