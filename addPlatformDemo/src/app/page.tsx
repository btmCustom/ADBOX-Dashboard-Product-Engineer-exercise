const KPIS = ["Spend", "Conversions", "CPA", "ROAS"];

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
          {KPIS.map((kpi) => (
            <div key={kpi} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">{kpi}</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-300">—</div>
            </div>
          ))}
        </div>

        <Panel title="Chart">
          <Placeholder label="Metric × dimension chart" height="h-72" />
        </Panel>

        <Panel title="Totals by initiative and channel">
          <Placeholder label="Totals table" />
        </Panel>

        <Panel title="Unmatched and ambiguous campaigns">
          <Placeholder label="Campaign matching review" height="h-24" />
        </Panel>
      </main>
    </div>
  );
}
