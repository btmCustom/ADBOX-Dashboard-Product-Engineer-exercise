import { CHANNEL_LABEL, CHANNELS } from "@/lib/channels";
import type { DashboardCampaign } from "@/lib/dashboardData";
import type { ReportGroup } from "@/lib/groups";
import type { Metrics, NormalizedRow } from "@/lib/ingest";
import { formatMetric, groupTotals, METRICS, sumRows, totalsMatch } from "@/lib/metrics";

interface Props {
  rows: NormalizedRow[];
  campaignOf: (externalCampaignId: string) => DashboardCampaign;
  groups: ReportGroup[];
}

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

export function TotalsTable({ rows, campaignOf, groups }: Props) {
  // Group totals and the grand total are summed from rows independently of the channel breakdown,
  // so the reconciliation check below compares independent sums rather than restating one.
  const byGroup = groupTotals(rows, (r) => campaignOf(r.externalCampaignId).groupKey);
  const byGroupChannel = groupTotals(rows, (r) => {
    const campaign = campaignOf(r.externalCampaignId);
    return `${campaign.groupKey}|${campaign.channel}`;
  });
  const grandTotal = sumRows(rows);

  const sections = groups
    .filter((g) => byGroup.has(g.key))
    .map((group) => ({
      group,
      total: byGroup.get(group.key)!,
      channels: CHANNELS.filter((ch) => byGroupChannel.has(`${group.key}|${ch}`)).map((channel) => ({
        channel,
        total: byGroupChannel.get(`${group.key}|${channel}`)!,
      })),
    }));

  const channelsReconcile = sections.every((s) => totalsMatch(sumRows(s.channels.map((c) => c.total)), s.total));
  const groupsReconcile = totalsMatch(sumRows(sections.map((s) => s.total)), grandTotal);
  const reconciles = channelsReconcile && groupsReconcile;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="py-2 pr-3 text-left font-medium">Initiative / channel</th>
              {METRICS.map((m) => (
                <th key={m.key} className="whitespace-nowrap px-2 py-2 text-right font-medium">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          {sections.map(({ group, total, channels }) => (
            <tbody key={group.key} className="border-b border-zinc-200">
              <tr className="bg-zinc-50 font-medium">
                <td className="whitespace-nowrap py-2 pr-3">
                  {GROUP_TAG[group.kind] ? (
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${GROUP_TAG[group.kind]}`}>
                      {group.label}
                    </span>
                  ) : (
                    group.label
                  )}
                </td>
                <MetricCells totals={total} />
              </tr>
              {channels.map(({ channel, total: channelTotal }) => (
                <tr key={channel} className="text-zinc-600">
                  <td className="whitespace-nowrap py-2 pl-5 pr-3">{CHANNEL_LABEL[channel]}</td>
                  <MetricCells totals={channelTotal} />
                </tr>
              ))}
            </tbody>
          ))}
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
