import type { MatchStatus } from "./matching";

export interface ReportGroup {
  key: string;
  label: string;
  kind: "initiative" | "ambiguous" | "unmatched";
}

// Ambiguous and unmatched campaigns get their own groups so initiatives + these always sum to the grand total.
export function reportGroupKey(campaign: { internalCampaignId: string | null; matchStatus: MatchStatus }): string {
  return campaign.internalCampaignId ?? (campaign.matchStatus === "ambiguous" ? "ambiguous" : "unmatched");
}

export function buildReportGroups(internalCampaigns: { id: string; name: string }[]): ReportGroup[] {
  return [
    ...internalCampaigns.map((ic) => ({ key: ic.id, label: ic.name, kind: "initiative" as const })),
    { key: "ambiguous", label: "Ambiguous", kind: "ambiguous" },
    { key: "unmatched", label: "Unmatched", kind: "unmatched" },
  ];
}
