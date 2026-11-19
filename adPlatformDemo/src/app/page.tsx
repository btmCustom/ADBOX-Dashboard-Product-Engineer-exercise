import { loadDashboardData } from "@/lib/dashboardData";
import { Dashboard } from "@/components/Dashboard";
import { Badge, Panel } from "@/components/ui";
import { CHANNEL_LABEL, channelOf } from "@/lib/channels";
import type { MatchStatus } from "@/lib/matching";

const REVIEW_STATUSES = new Set<MatchStatus>(["manual", "ambiguous", "unmatched"]);

const STATUS_TONE: Record<"manual" | "ambiguous" | "unmatched", "blue" | "warning" | "gray"> = {
  manual: "blue",
  ambiguous: "warning",
  unmatched: "gray",
};

const STATUS_LABEL: Record<"manual" | "ambiguous" | "unmatched", string> = {
  manual: "Manual",
  ambiguous: "Ambiguous",
  unmatched: "Unmatched",
};

const STATUS_ORDER: Record<"manual" | "ambiguous" | "unmatched", number> = {
  ambiguous: 0,
  unmatched: 1,
  manual: 2,
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Home() {
  const { rows, campaigns, internalCampaigns, groups, dashboardCampaigns } = loadDashboardData();

  const spendByCampaign = new Map<string, number>();
  for (const r of rows) {
    spendByCampaign.set(r.externalCampaignId, (spendByCampaign.get(r.externalCampaignId) ?? 0) + r.spend);
  }

  const initiativeName = new Map(internalCampaigns.map((ic) => [ic.id, ic.name]));
  const reviewCampaigns = campaigns
    .filter((c) => REVIEW_STATUSES.has(c.matchStatus))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.matchStatus as keyof typeof STATUS_ORDER] -
          STATUS_ORDER[b.matchStatus as keyof typeof STATUS_ORDER] ||
        (spendByCampaign.get(b.id) ?? 0) - (spendByCampaign.get(a.id) ?? 0),
    );

  const ambiguousCount = reviewCampaigns.filter((c) => c.matchStatus === "ambiguous").length;
  const unmatchedCount = reviewCampaigns.filter((c) => c.matchStatus === "unmatched").length;
  const manualCount = reviewCampaigns.filter((c) => c.matchStatus === "manual").length;

  return (
    <div className="min-h-full flex-1 bg-gray-50 font-sans text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6">
          <p className="text-sm font-semibold text-brand-700">ADBOX Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Harbor Point Bank · Paid Media
          </h1>
          <p className="text-base text-gray-600">
            Meta, Google Ads and Amazon DSP · Aug 1 – Sep 29, 2026
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {reviewCampaigns.length > 0 ? (
          <div
            role="status"
            className="flex gap-4 rounded-xl border border-warning-100 bg-warning-25 p-4 shadow-xs"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Campaign matching needs attention</p>
              <p className="mt-1 text-sm text-gray-600">
                {[
                  `${ambiguousCount} ambiguous`,
                  `${unmatchedCount} unmatched`,
                  manualCount > 0 ? `${manualCount} assigned by manual override` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                . These sit in Ambiguous / Unmatched totals (or their override initiative) until mapped in{" "}
                <code className="break-all rounded-md bg-warning-100 px-1.5 py-0.5 font-mono text-xs text-warning-700">
                  src/config/campaignOverrides.ts
                </code>
                .
              </p>
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="rounded-xl border border-success-100 bg-success-25 px-4 py-3 text-sm text-success-700 shadow-xs"
          >
            All campaigns matched automatically.
          </div>
        )}

        {reviewCampaigns.length > 0 && (
          <Panel
            title={`Campaigns to review (${reviewCampaigns.length})`}
            description="Ambiguous and unmatched campaigns, plus any manual overrides."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                    <th className="pb-3 pr-4 font-medium">Initiative</th>
                    <th className="pb-3 pr-4 font-medium">Match</th>
                    <th className="pb-3 pr-4 font-medium">Channel</th>
                    <th className="pb-3 pr-4 font-medium">Campaign</th>
                    <th className="pb-3 text-right font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reviewCampaigns.map((c) => {
                    const status = c.matchStatus as keyof typeof STATUS_TONE;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-4 pr-4 text-gray-700">
                          {c.internalCampaignId ? (
                            initiativeName.get(c.internalCampaignId)
                          ) : c.candidates.length > 0 ? (
                            <span className="font-medium text-warning-700">
                              {c.candidates.map((id) => initiativeName.get(id)).join(" or ")}?
                            </span>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                        </td>
                        <td className="whitespace-nowrap py-4 pr-4 text-gray-600">
                          {CHANNEL_LABEL[channelOf(c.id)]}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="mt-0.5 font-mono text-xs text-gray-500">{c.id}</div>
                        </td>
                        <td className="py-4 text-right font-medium tabular-nums text-gray-900">
                          {usd.format(spendByCampaign.get(c.id) ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <Dashboard rows={rows} campaigns={dashboardCampaigns} groups={groups} />
      </main>
    </div>
  );
}
