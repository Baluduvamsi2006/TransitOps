import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

function toStatusTone(status: string) {
  return (
    {
      AVAILABLE: "success",
      ON_TRIP: "info",
      IN_SHOP: "warning",
      RETIRED: "danger"
    }[status] || "muted"
  ) as "success" | "info" | "warning" | "danger" | "muted";
}

export default async function ReportsPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      maintenanceLogs: true,
      fuelLogs: true,
      expenses: true,
      trips: {
        where: { status: "COMPLETED" }
      }
    }
  });

  let totalFleetCost = 0;
  let totalFleetRevenue = 0;
  let totalFleetDistance = 0;
  let totalFleetLiters = 0;

  // Process data per vehicle
  const vehicleStats = vehicles.map(vehicle => {
    // Costs
    const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    const fuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const expenseCost = vehicle.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const operationalCost = maintenanceCost + fuelCost + expenseCost;

    totalFleetCost += operationalCost;

    // Fuel Liters
    const fuelLiters = vehicle.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    totalFleetLiters += fuelLiters;

    // Distance & pseudo-Revenue (assumes $15 revenue per km of completed trips)
    const distance = vehicle.trips.reduce((sum, trip) => sum + trip.plannedDistance, 0);
    totalFleetDistance += distance;
    const revenue = distance * 15;
    totalFleetRevenue += revenue;

    const fuelEfficiency = fuelLiters > 0 ? (distance / fuelLiters) : 0;
    const roi = operationalCost > 0 ? ((revenue - operationalCost) / operationalCost) * 100 : 0;

    return {
      ...vehicle,
      operationalCost,
      revenue,
      fuelEfficiency,
      roi
    };
  });

  const fleetROI = totalFleetCost > 0 ? (((totalFleetRevenue - totalFleetCost) / totalFleetCost) * 100) : 0;
  const overallFuelEfficiency = totalFleetLiters > 0 ? (totalFleetDistance / totalFleetLiters) : 0;

  const fleetUtilization = vehicles.length > 0
    ? ((vehicles.filter(v => v.status === "ON_TRIP").length / vehicles.length) * 100)
    : 0;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const reportMetrics = [
    { label: "Fuel Efficiency (Avg)", value: `${overallFuelEfficiency.toFixed(1)} km/L`, tone: "success" as const },
    { label: "Fleet Utilization", value: `${fleetUtilization.toFixed(0)}%`, tone: "accent" as const },
    { label: "Operational Cost", value: formatCurrency(totalFleetCost), tone: "warning" as const },
    { label: "Fleet ROI", value: `${fleetROI.toFixed(1)}%`, tone: "info" as const }
  ];

  // Top Cost Vehicles
  const topCostVehicles = [...vehicleStats].sort((a, b) => b.operationalCost - a.operationalCost).slice(0, 5);
  const highestCost = topCostVehicles.length > 0 ? topCostVehicles[0].operationalCost : 1; // avoid div by 0

  return (
    <AppShell activePath="/reports">
      <PageHeader
        eyebrow="Reports & Analytics"
        title="Live operational cost, efficiency, and ROI"
        description="A real-time reporting surface integrating maintenance records, fuel logs, and trip distances strictly from the database."
      />

      <StatGrid>
        {reportMetrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.95fr]">
        <Panel title="Revenue vs Expenses Overview" subtitle="Quick database aggregate summaries.">
          <div className="flex h-56 flex-col justify-center gap-6 px-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[var(--muted)]">
                <span>Total Revenue (Est)</span>
                <span className="text-white">{formatCurrency(totalFleetRevenue)}</span>
              </div>
              <div className="h-4 rounded-full bg-[var(--panel-strong)]">
                <div className="h-4 rounded-full bg-[var(--success)]" style={{ width: totalFleetRevenue > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[var(--muted)]">
                <span>Total Cost (Maint + Fuel + Exp)</span>
                <span className="text-white">{formatCurrency(totalFleetCost)}</span>
              </div>
              <div className="h-4 rounded-full bg-[var(--panel-strong)]">
                <div className="h-4 rounded-full bg-[var(--warning)]" style={{ width: totalFleetCost > 0 ? `${Math.min((totalFleetCost / (totalFleetRevenue || 1)) * 100, 100)}%` : '0%' }} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Top cost vehicles" subtitle="A live ranking of fleet assets with the highest operational spend.">
          <div className="space-y-4">
            {topCostVehicles.map((item) => {
              const percentage = (item.operationalCost / highestCost) * 100;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                    <span>{item.registrationNumber}</span>
                    <span>{formatCurrency(item.operationalCost)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--panel-strong)]">
                    <div className="h-2 rounded-full bg-[var(--warning)]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Per-vehicle report" subtitle="Fuel efficiency, combined operational costs, revenue, and ROI for each asset.">
        <Table
          columns={["Vehicle", "Fuel Efficiency", "Operational Cost", "Revenue", "ROI", "State"]}
          rows={vehicleStats.map((stats) => [
            <div key={`v-${stats.id}`}>
              <div className="font-semibold">{stats.nameModel}</div>
              <div className="text-xs text-[var(--muted)]">{stats.registrationNumber}</div>
            </div>,
            `${stats.fuelEfficiency.toFixed(1)} km/L`,
            formatCurrency(stats.operationalCost),
            formatCurrency(stats.revenue),
            <span key={`${stats.id}-roi`} className={stats.roi >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
              {stats.roi > 0 ? "+" : ""}{stats.roi.toFixed(1)}%
            </span>,
            <Pill key={`${stats.id}-state`} tone={toStatusTone(stats.status)}>{stats.status.replace("_", " ")}</Pill>
          ])}
        />
      </Panel>
    </AppShell>
  );
}