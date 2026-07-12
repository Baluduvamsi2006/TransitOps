import { AppShell } from "../components/transit-shell";
import { MetricCard, Panel, PageHeader, Pill, StatGrid, Table } from "../components/transit-ui";
import {
  dashboardKpis,
  maintenanceRows,
  recentTrips,
  vehicleRows,
  vehicleStatusBars
} from "../lib/transitops-data";

export default function Home() {
  return (
    <AppShell activePath="/">
      <PageHeader
        eyebrow="Dashboard"
        title="Fleet command center"
        description="A reference-first operations dashboard for vehicle control, dispatch visibility, maintenance, and cost tracking."
      />

      <StatGrid>
        {dashboardKpis.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="Recent trips" subtitle="Dispatch activity and completion status">
          <Table
            columns={["Trip", "Vehicle", "Driver", "Status", "Notes"]}
            rows={recentTrips.map((trip) => [
              trip.code,
              trip.vehicle,
              trip.driver,
              <Pill key={`${trip.code}-status`} tone={trip.tone}>{trip.status}</Pill>,
              trip.notes
            ])}
          />
        </Panel>

        <Panel title="Vehicle status" subtitle="Availability mix across the live fleet">
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
        </Panel>
      </div>

      <Panel title="Fleet snapshot" subtitle="High-value vehicles and compliance flags">
        <Table
          columns={["Reg no.", "Vehicle", "Type", "Capacity", "Status"]}
          rows={vehicleRows.slice(0, 6).map((vehicle) => [
            vehicle.reg,
            vehicle.name,
            vehicle.type,
            `${vehicle.capacity} kg`,
            <Pill key={`${vehicle.reg}-pill`} tone={vehicle.tone}>{vehicle.status}</Pill>
          ])}
        />
      </Panel>

      <Panel title="Maintenance queue" subtitle="Active service records that keep vehicles in shop">
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