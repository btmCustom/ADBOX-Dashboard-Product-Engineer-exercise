export function Panel({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        {actions}
      </div>
      {children}
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
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      {label}
      <select
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
