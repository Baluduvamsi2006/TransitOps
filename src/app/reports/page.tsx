import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { monthlyBars, reportMetrics, topCostBars, vehicleRows } from "../../lib/transitops-data";

export default function ReportsPage() {
  return (
    <AppShell activePath="/reports">
      <PageHeader
        eyebrow="Reports & Analytics"
        title="Operational cost, fuel efficiency, and ROI"
        description="A reporting surface for fleet utilization, vehicle economics, and simple visual analytics that mirror the hackathon reference."
      />

      <StatGrid>
        {reportMetrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.95fr]">
        <Panel title="Monthly revenue trend" subtitle="Simple vertical bars used as a reference for the later charting pass.">
          <div className="flex h-56 items-end gap-3">
            {monthlyBars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-2xl bg-(--accent)" style={{ height: bar.width }} />
                <span className="text-xs text-(--muted)">{bar.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top cost vehicles" subtitle="A quick ranking of fleet assets with the highest operational spend.">
          <div className="space-y-4">
            {topCostBars.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-(--muted)">
                  <span>{item.label}</span>
                  <span>{item.cost}</span>
                </div>
                <div className="h-2 rounded-full bg-(--panel-strong)">
                  <div className="h-2 rounded-full bg-(--warning)" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Per-vehicle report" subtitle="Fuel efficiency, operational cost, revenue, and ROI for each asset.">
        <Table
          columns={["Vehicle", "Fuel Efficiency", "Operational Cost", "Revenue", "ROI", "State"]}
          rows={vehicleRows.map((vehicle, index) => [
            vehicle.reg,
            `${(12 + index * 0.8).toFixed(1)} km/L`,
            `$${(11000 + index * 1450).toLocaleString()}`,
            `$${(15000 + index * 1800).toLocaleString()}`,
            <span key={`${vehicle.reg}-roi`} className={index % 2 === 0 ? "text-(--success)" : "text-(--info)"}>
              {(8 + index * 1.2).toFixed(1)}%
            </span>,
            <Pill key={`${vehicle.reg}-state`} tone={vehicle.tone}>{vehicle.status}</Pill>
          ])}
        />
      </Panel>
    </AppShell>
  );
}