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
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-end gap-3">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
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
    <div className={`flex min-w-[11rem] flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-3.5 text-base text-gray-900 shadow-xs transition-colors hover:border-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-gray-500"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "brand" | "success" | "warning" | "error" | "blue";
}) {
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
    success: "bg-success-50 text-success-700 ring-success-100",
    warning: "bg-warning-50 text-warning-700 ring-warning-100",
    error: "bg-error-50 text-error-700 ring-error-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-25 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          <path
            d="M4 7h16M4 12h10M4 17h7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-gray-600">{detail}</p> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "link";
}) {
  const styles = {
    primary:
      "h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 focus:ring-4 focus:ring-brand-100",
    secondary:
      "h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 focus:ring-4 focus:ring-brand-100",
    link: "h-11 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus:ring-4 focus:ring-brand-100",
  };
  return (
    <button type="button" onClick={onClick} className={`${styles[variant]} focus:outline-none`}>
      {children}
    </button>
  );
}
