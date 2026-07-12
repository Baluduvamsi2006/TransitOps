import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { vehicleRows, vehicleStatusBars } from "../../lib/transitops-data";

const fleetSummary = [
  { label: "Vehicles Registered", value: "32", tone: "accent" as const },
  { label: "Available for Dispatch", value: "16", tone: "success" as const },
  { label: "In Shop", value: "5", tone: "warning" as const },
  { label: "Retired Assets", value: "2", tone: "danger" as const }
];

export default function FleetPage() {
  return (
    <AppShell activePath="/fleet">
      <PageHeader
        eyebrow="Fleet Registry"
        title="Vehicles and asset lifecycle"
        description="A master list for registration, type, capacity, odometer tracking, acquisition cost, and operational state."
      />

      <StatGrid>
        {fleetSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel title="Vehicle list" subtitle="Search, filter, and inspect the live fleet inventory.">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">Search reg / model</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">Type: All</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">Status: All</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">Region: All</div>
          </div>

          <Table
            columns={["Reg no.", "Vehicle", "Type", "Capacity", "Odometer", "Cost", "Status"]}
            rows={vehicleRows.map((vehicle) => [
              vehicle.reg,
              vehicle.name,
              vehicle.type,
              `${vehicle.capacity} kg`,
              `${vehicle.capacity * 18} km`,
              `$${(vehicle.capacity * 1320).toLocaleString()}`,
              <Pill key={`${vehicle.reg}-vehicle`} tone={vehicle.tone}>{vehicle.status}</Pill>
            ])}
          />
        </Panel>

        <Panel title="Availability mix" subtitle="Live status split used for dispatch selection and dashboard KPIs.">
          <div className="space-y-4">
            {vehicleStatusBars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>{bar.label}</span>
                  <span>{bar.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--panel-strong)]">
                  <div className={`h-2 rounded-full ${bar.fill}`} style={{ width: bar.width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/6 p-4 text-sm leading-7 text-[var(--muted-2)]">
            Retired and in-shop vehicles are displayed here for lifecycle visibility but are excluded from dispatch selection in the next phase.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}