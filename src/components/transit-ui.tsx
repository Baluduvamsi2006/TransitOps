type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "accent" | "success" | "warning" | "info" | "neutral";
};

export function MetricCard({ label, value, tone = "neutral" }: MetricCardProps) {
  const toneClass = {
    accent: "text-[var(--accent)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    info: "text-[var(--info)]",
    neutral: "text-white"
  }[tone];

  return (
    <article className="rounded-[1.4rem] border border-white/8 bg-[var(--panel)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className={`mt-4 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </article>
  );
}

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="rounded-[1.6rem] border border-white/8 bg-[var(--panel)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] lg:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-2)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-7 text-[var(--muted-2)] sm:text-base">{description}</p>
    </div>
  );
}

type PillProps = {
  tone?: "accent" | "success" | "warning" | "info" | "danger" | "muted";
  children: React.ReactNode;
};

export function Pill({ tone = "muted", children }: PillProps) {
  const classes = {
    accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-[color:var(--accent-2)]",
    success: "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)] border-[color:rgba(63,174,108,0.35)]",
    warning: "bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-[var(--warning)] border-[color:rgba(224,160,46,0.35)]",
    info: "bg-[color-mix(in_srgb,var(--info)_18%,transparent)] text-[var(--info)] border-[color:rgba(79,143,209,0.35)]",
    danger: "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--danger)] border-[color:rgba(217,80,63,0.35)]",
    muted: "bg-white/6 text-[var(--muted)] border-white/8"
  }[tone];

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

type StatGridProps = {
  children: React.ReactNode;
};

export function StatGrid({ children }: StatGridProps) {
  return <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

type TableProps = {
  columns: string[];
  rows: React.ReactNode[][];
};

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/2">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/4 text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold last:text-right">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-white/6 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`px-4 py-3 ${cellIndex === row.length - 1 ? "text-right" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}