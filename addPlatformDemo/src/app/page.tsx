import { loadDashboardData } from "@/lib/dashboardData";
import { Dashboard } from "@/components/Dashboard";
import { Panel } from "@/components/ui";
import { CHANNEL_LABEL, channelOf } from "@/lib/channels";
import type { MatchStatus } from "@/lib/matching";

const REVIEW_STATUSES = new Set<MatchStatus>(["manual", "ambiguous", "unmatched"]);

const STATUS_STYLE: Record<"manual" | "ambiguous" | "unmatched", { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200" },
  ambiguous: { label: "Ambiguous", className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200" },
  unmatched: { label: "Unmatched", className: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200" },
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
    <div className="min-h-full flex-1 bg-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">ADBOX Dashboard</p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Harbor Point Bank · Paid Media</h1>
          <p className="text-sm text-zinc-500">
            Meta, Google Ads and Amazon DSP · Aug 1 – Sep 29, 2026
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        {reviewCampaigns.length > 0 ? (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900"
            >
              !
            </span>
            <div>
              <p className="font-semibold">Campaign matching needs attention</p>
              <p className="mt-1 text-amber-900/80">
                {[
                  `${ambiguousCount} ambiguous`,
                  `${unmatchedCount} unmatched`,
                  manualCount > 0 ? `${manualCount} assigned by manual override` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                . These sit in Ambiguous / Unmatched totals (or their override initiative) until mapped in{" "}
                <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-xs">
                  src/config/campaignOverrides.ts
                </code>
                .
              </p>
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm"
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
                <thead className="border-b border-zinc-200 text-xs tracking-wide text-zinc-500 uppercase">
                  <tr>
                    <th className="py-2.5 pr-4 font-medium">Initiative</th>
                    <th className="py-2.5 pr-4 font-medium">Match</th>
                    <th className="py-2.5 pr-4 font-medium">Channel</th>
                    <th className="py-2.5 pr-4 font-medium">Campaign</th>
                    <th className="py-2.5 pr-4 text-right font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {reviewCampaigns.map((c) => {
                    const status = STATUS_STYLE[c.matchStatus as keyof typeof STATUS_STYLE];
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50">
                        <td className="py-2.5 pr-4">
                          {c.internalCampaignId ? (
                            initiativeName.get(c.internalCampaignId)
                          ) : c.candidates.length > 0 ? (
                            <span className="text-amber-800">
                              {c.candidates.map((id) => initiativeName.get(id)).join(" or ")}?
                            </span>
                          ) : (
                            <span className="text-zinc-400">None</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600">
                          {CHANNEL_LABEL[channelOf(c.id)]}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="font-medium text-zinc-900">{c.name}</div>
                          <div className="font-mono text-xs text-zinc-400">{c.id}</div>
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-900">
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
