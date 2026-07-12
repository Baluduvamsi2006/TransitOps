import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { maintenanceRows } from "../../lib/transitops-data";

const maintenanceSummary = [
  { label: "Active Records", value: "2", tone: "warning" as const },
  { label: "Closed Records", value: "2", tone: "success" as const },
  { label: "Vehicles In Shop", value: "5", tone: "danger" as const },
  { label: "Average Ticket", value: "$8.2K", tone: "accent" as const }
];

export default function MaintenancePage() {
  return (
    <AppShell activePath="/maintenance">
      <PageHeader
        eyebrow="Maintenance"
        title="Service workflow and in-shop tracking"
        description="A maintenance workspace that mirrors the reference flow: open service records move vehicles to In Shop until they are closed."
      />

      <StatGrid>
        {maintenanceSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.15fr]">
        <Panel title="Log service record" subtitle="Creating an active maintenance log should immediately remove the vehicle from dispatch selection.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Vehicle</p>
              <p className="mt-2 text-sm text-white">GJ05CC0850</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Service type</p>
              <p className="mt-2 text-sm text-white">Oil Change</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Cost</p>
              <p className="mt-2 text-sm text-white">$4,600</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Status</p>
              <p className="mt-2 text-sm text-white">Active</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/8 bg-white/6 p-4 text-sm leading-7 text-[var(--muted-2)]">
            An active maintenance log marks the vehicle as In Shop; closing it restores the vehicle to Available unless a retire action is taken.
          </div>
        </Panel>

        <Panel title="Service notes" subtitle="These notes map to the behavior that will be enforced after the database connection is added.">
          <div className="space-y-4 text-sm leading-7 text-[var(--muted-2)]">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Open maintenance blocks dispatch by removing the vehicle from the driver selection pool.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Closing a log returns the vehicle to Available, unless the asset has been retired.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">The UI will later connect cost data into fuel and total operational cost calculations.</div>
          </div>
        </Panel>
      </div>

      <Panel title="Service log" subtitle="Current and historical maintenance records shown together for quick oversight.">
        <Table
          columns={["Vehicle", "Service", "Date", "Cost", "State"]}
          rows={maintenanceRows.map((record) => [
            record.vehicle,
            record.service,
            record.date,
            record.cost,
            <Pill key={`${record.vehicle}-maint`} tone={record.tone}>{record.state}</Pill>
          ])}
        />
      </Panel>
    </AppShell>
  );
}