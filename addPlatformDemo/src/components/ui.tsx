export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-zinc-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-end gap-3">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Placeholder({ label, height = "h-40" }: { label: string; height?: string }) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-400`}
    >
      {label}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className={`flex min-w-[10.5rem] flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-3 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-zinc-400"
        >
          ▼
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-zinc-500">{detail}</p> : null}
    </div>
  );
}
