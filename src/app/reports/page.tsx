import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

function getStatusTone(status: string) {
  switch (status) {
    case "AVAILABLE": return "success";
    case "ON_TRIP": return "info";
    case "IN_SHOP": return "warning";
    case "RETIRED": return "danger";
    default: return "muted";
  }
}

// Pricing formula: base rate of ₹15/km + ₹0.005 per kg of cargo load
function calculateTripRevenue(distance: number, weight: number) {
  return distance * (15 + weight * 0.005);
}

export default async function ReportsPage() {
  // Fetch all vehicles with their related costs and trips
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: { status: "COMPLETED" }
      },
      fuelLogs: true,
      maintenanceLogs: true,
      expenses: true
    }
  });

  // Fetch all completed trips to map monthly revenue trends
  const completedTrips = await prisma.trip.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "asc" }
  });

  // 1. Calculate General Fleet Metrics
  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === "ON_TRIP").length;
  const fleetUtilization = totalVehiclesCount > 0 ? (activeVehiclesCount / totalVehiclesCount) * 100 : 0;

  let totalDistanceCompleted = 0;
  let totalLitersConsumed = 0;
  let totalFuelCost = 0;
  let totalMaintCost = 0;
  let totalOtherCost = 0;
  let totalRevenueEarned = 0;
  let totalAcquisitionCost = 0;

  const vehicleStats = vehicles.map((v) => {
    const tripRevenue = v.trips.reduce((sum, trip) => sum + calculateTripRevenue(trip.plannedDistance, trip.cargoWeight), 0);
    const fuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const fuelLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    const maintCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    const otherCost = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const opCost = fuelCost + maintCost + otherCost;
    const distance = v.trips.reduce((sum, trip) => sum + trip.plannedDistance, 0);
    
    // Fuel Efficiency (Distance / Liters)
    const efficiency = fuelLiters > 0 ? distance / fuelLiters : 0;

    // ROI: [ (Revenue - OpCost) / AcquisitionCost ] * 100
    const roi = v.acquisitionCost > 0 ? ((tripRevenue - opCost) / v.acquisitionCost) * 100 : 0;

    totalDistanceCompleted += distance;
    totalLitersConsumed += fuelLiters;
    totalFuelCost += fuelCost;
    totalMaintCost += maintCost;
    totalOtherCost += otherCost;
    totalRevenueEarned += tripRevenue;
    totalAcquisitionCost += v.acquisitionCost;

    return {
      id: v.id,
      nameModel: v.nameModel,
      registrationNumber: v.registrationNumber,
      status: v.status,
      efficiency,
      opCost,
      revenue: tripRevenue,
      roi,
      acquisitionCost: v.acquisitionCost
    };
  });

  const overallFuelEfficiency = totalLitersConsumed > 0 ? totalDistanceCompleted / totalLitersConsumed : 0;
  const overallOpCost = totalFuelCost + totalMaintCost + totalOtherCost;
  const overallROI = totalAcquisitionCost > 0 ? ((totalRevenueEarned - overallOpCost) / totalAcquisitionCost) * 100 : 0;

  const reportMetrics = [
    { label: "Fuel Efficiency", value: `${overallFuelEfficiency.toFixed(1)} km/L`, tone: "success" as const },
    { label: "Fleet Utilization", value: `${fleetUtilization.toFixed(0)}%`, tone: "accent" as const },
    { label: "Operational Cost", value: `₹${overallOpCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, tone: "warning" as const },
    { label: "Vehicle ROI", value: `${overallROI.toFixed(1)}%`, tone: "info" as const }
  ];

  // 2. Map Monthly Revenue Trends (Last 7 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenueMap: { [key: string]: number } = {};

  // Initialize last 7 months
  const now = new Date();
  const activeMonths: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mLabel = `${monthNames[d.getMonth()]}`;
    activeMonths.push(mLabel);
    monthlyRevenueMap[mLabel] = 0;
  }

  completedTrips.forEach((trip) => {
    if (trip.completedAt) {
      const mLabel = monthNames[trip.completedAt.getMonth()];
      if (mLabel in monthlyRevenueMap) {
        monthlyRevenueMap[mLabel] += calculateTripRevenue(trip.plannedDistance, trip.cargoWeight);
      }
    }
  });

  const maxMonthlyRevenue = Math.max(...Object.values(monthlyRevenueMap), 1000);
  const monthlyBars = activeMonths.map((m) => {
    const rev = monthlyRevenueMap[m] || 0;
    // Scale bar height dynamically to max 160px
    const barHeight = `${(rev / maxMonthlyRevenue) * 160}px`;
    return {
      label: m,
      height: barHeight,
      value: rev
    };
  });

  // 3. Ranked Top Cost Vehicles
  const sortedByCost = [...vehicleStats].sort((a, b) => b.opCost - a.opCost);
  const maxVehicleCost = sortedByCost[0]?.opCost || 1000;
  const topCostBars = sortedByCost.slice(0, 5).map((v) => {
    // Scale progress bar width dynamically to max 100%
    const barWidth = `${(v.opCost / maxVehicleCost) * 100}%`;
    return {
      label: `${v.nameModel} (${v.registrationNumber})`,
      cost: `₹${v.opCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      width: barWidth
    };
  });

  return (
    <AppShell activePath="/reports" user={null}>
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

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.95fr] mb-6">
        <Panel title="Monthly revenue trend" subtitle="Revenues calculated from completed cargo loads over the last 7 months.">
          <div className="flex h-56 items-end gap-3 px-2">
            {monthlyBars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2 group relative">
                <div 
                  className="w-full rounded-t-2xl bg-[var(--accent)] hover:brightness-110 transition-all duration-300" 
                  style={{ height: bar.height }} 
                />
                <span className="text-xs text-[var(--muted)]">{bar.label}</span>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 bg-[#161618] border border-white/10 rounded px-2 py-1 text-[10px] text-white transition-all duration-200">
                  ₹{bar.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top cost vehicles" subtitle="Live ranking of fleet assets with the highest total operational spend.">
          <div className="space-y-4">
            {topCostBars.length === 0 ? (
              <div className="text-sm text-[var(--muted-2)]">No vehicle operational costs logged.</div>
            ) : (
              topCostBars.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                    <span className="truncate pr-2 font-medium">{item.label}</span>
                    <span className="text-white font-mono">{item.cost}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-2 rounded-full bg-[var(--warning)] transition-all duration-500" style={{ width: item.width }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Per-vehicle report" subtitle="Fuel efficiency, operational cost, revenue, and ROI for each asset.">
        <Table
          columns={["Vehicle", "Fuel Efficiency", "Operational Cost", "Revenue", "ROI", "State"]}
          rows={vehicleStats.map((vehicle) => [
            <div key={`${vehicle.id}-vehicle`}>
              <div className="font-semibold text-white">{vehicle.nameModel}</div>
              <div className="text-xs text-[var(--muted)]">{vehicle.registrationNumber}</div>
            </div>,
            vehicle.efficiency > 0 ? `${vehicle.efficiency.toFixed(1)} km/L` : "—",
            `₹${vehicle.opCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            `₹${vehicle.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            <span 
              key={`${vehicle.id}-roi`} 
              className={vehicle.roi >= 0 ? "text-[var(--success)] font-medium" : "text-[var(--danger)] font-medium"}
            >
              {vehicle.roi.toFixed(1)}%
            </span>,
            <Pill key={`${vehicle.id}-state`} tone={getStatusTone(vehicle.status) as any}>
              {vehicle.status.replace("_", " ")}
            </Pill>
          ])}
        />
      </Panel>
    </AppShell>
  );
}