import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { expenseRows, financeSummary, fuelRows } from "../../lib/transitops-data";

const financeKpis = [
  { label: "Fuel Spend", value: "$31.5K", tone: "accent" as const },
  { label: "Maintenance Spend", value: "$43.0K", tone: "warning" as const },
  { label: "Other Expenses", value: "$12.4K", tone: "info" as const },
  { label: "Total Cost", value: "$86.9K", tone: "success" as const }
];

export default function FinancePage() {
  return (
    <AppShell activePath="/finance">
      <PageHeader
        eyebrow="Fuel & Expenses"
        title="Cost logging and operational spend"
        description="A finance workspace for fuel logs, tolls, maintenance expenses, and the total cost view used by analytics."
      />

      <StatGrid>
        {financeKpis.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Logging drawer" subtitle="This area will later become the inline create form for fuel and expense entries.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Fuel log fields</p>
              <p className="mt-2 text-sm text-white">Vehicle, liters, cost, date</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Expense fields</p>
              <p className="mt-2 text-sm text-white">Trip, toll, other, date</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/8 bg-white/6 p-4 text-sm leading-7 text-[var(--muted-2)]">
            Fuel and maintenance spending will feed fleet utilization, operational cost, and ROI reporting once the database layer is connected.
          </div>
        </Panel>

        <Panel title="Spend summary" subtitle="A quick cost breakdown for the finance team and fleet manager.">
          <div className="space-y-3">
            {financeSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Fuel logs" subtitle="Per-vehicle fuel records used for efficiency calculations.">
        <Table
          columns={["Vehicle", "Date", "Liters", "Cost"]}
          rows={fuelRows.map((row) => [
            row.vehicle,
            row.date,
            `${row.liters} L`,
            row.cost
          ])}
        />
      </Panel>

      <Panel title="Other expenses" subtitle="Tolls and other trip-linked expenses tracked separately from fuel.">
        <Table
          columns={["Trip", "Vehicle", "Toll", "Other", "Date", "State"]}
          rows={expenseRows.map((row) => [
            row.trip,
            row.vehicle,
            row.toll,
            row.other,
            row.date,
            <Pill key={`${row.trip}-expense`} tone="info">Logged</Pill>
          ])}
        />
      </Panel>
    </AppShell>
  );
}