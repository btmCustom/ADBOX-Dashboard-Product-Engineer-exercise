import { loadDashboardData } from "@/lib/dashboardData";
import { channelOf, type Channel } from "@/lib/ingest";
import type { MatchStatus } from "@/lib/matching";

const CHANNEL_LABEL: Record<Channel, string> = { meta: "Meta", google: "Google Ads", amazon: "Amazon DSP" };

const STATUS_STYLE: Record<MatchStatus, { label: string; className: string }> = {
  auto: { label: "Auto", className: "bg-emerald-50 text-emerald-700" },
  manual: { label: "Manual", className: "bg-sky-50 text-sky-700" },
  ambiguous: { label: "Ambiguous", className: "bg-amber-50 text-amber-800" },
  unmatched: { label: "Unmatched", className: "bg-zinc-100 text-zinc-600" },
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h2>
      {children}
    </section>
  );
}

function Placeholder({ label, height = "h-40" }: { label: string; height?: string }) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-400`}
    >
      {label}
    </div>
  );
}

export default function Home() {
  const { rows, campaigns, internalCampaigns } = loadDashboardData();

  const totals = rows.reduce(
    (t, r) => ({ spend: t.spend + r.spend, conversions: t.conversions + r.conversions, value: t.value + r.conversionValue }),
    { spend: 0, conversions: 0, value: 0 },
  );
  const cpa = ratio(totals.spend, totals.conversions);
  const roas = ratio(totals.value, totals.spend);
  const kpis = [
    { label: "Spend", value: usd.format(totals.spend) },
    { label: "Conversions", value: count.format(totals.conversions) },
    { label: "CPA", value: cpa === null ? "—" : usdCents.format(cpa) },
    { label: "ROAS", value: roas === null ? "—" : `${roas.toFixed(2)}×` },
  ];

  const spendByCampaign = new Map<string, number>();
  for (const r of rows) {
    spendByCampaign.set(r.externalCampaignId, (spendByCampaign.get(r.externalCampaignId) ?? 0) + r.spend);
  }

  const initiativeName = new Map(internalCampaigns.map((ic) => [ic.id, ic.name]));
  const initiativeOrder = new Map(internalCampaigns.map((ic, i) => [ic.id, i]));
  const rank = (id: string | null) => (id === null ? internalCampaigns.length : initiativeOrder.get(id)!);
  const sortedCampaigns = [...campaigns].sort(
    (a, b) =>
      rank(a.internalCampaignId) - rank(b.internalCampaignId) ||
      a.matchStatus.localeCompare(b.matchStatus) ||
      (spendByCampaign.get(b.id) ?? 0) - (spendByCampaign.get(a.id) ?? 0),
  );

  return (
    <div className="min-h-full flex-1 bg-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-lg font-semibold">Harbor Point Bank · Paid Media</h1>
          <p className="text-sm text-zinc-500">
            Meta, Google Ads and Amazon DSP · Aug 1 – Sep 29, 2026
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="flex gap-3">
          <Placeholder label="Channel filter" height="h-10 w-48" />
          <Placeholder label="Initiative filter" height="h-10 w-48" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">{kpi.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{kpi.value}</div>
            </div>
          ))}
        </div>

        <Panel title="Chart">
          <Placeholder label="Metric × dimension chart" height="h-72" />
        </Panel>

        <Panel title="Totals by initiative and channel">
          <Placeholder label="Totals table" />
        </Panel>

        <Panel title={`Campaigns (${campaigns.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Initiative</th>
                  <th className="py-2 pr-4 font-medium">Match</th>
                  <th className="py-2 pr-4 font-medium">Channel</th>
                  <th className="py-2 pr-4 font-medium">Campaign</th>
                  <th className="py-2 pr-4 text-right font-medium">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedCampaigns.map((c) => {
                  const status = STATUS_STYLE[c.matchStatus];
                  return (
                    <tr key={c.id}>
                      <td className="py-2 pr-4">
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
                      <td className="py-2 pr-4">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4 text-zinc-600">{CHANNEL_LABEL[channelOf(c.id)]}</td>
                      <td className="py-2 pr-4">
                        <div>{c.name}</div>
                        <div className="font-mono text-xs text-zinc-400">{c.id}</div>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {usd.format(spendByCampaign.get(c.id) ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </div>
  );
}
