import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { ReportFilters } from "./report-filters";

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

function getDriverStatusTone(status: string) {
  switch (status) {
    case "AVAILABLE": return "success";
    case "ON_TRIP": return "info";
    case "OFF_DUTY": return "muted";
    case "SUSPENDED": return "danger";
    default: return "muted";
  }
}

function getTripStatusTone(status: string) {
  switch (status) {
    case "COMPLETED": return "success";
    case "DISPATCHED": return "info";
    case "DRAFT": return "muted";
    case "CANCELLED": return "danger";
    default: return "muted";
  }
}

// Revenue formula: ₹15/km base + ₹0.005/kg cargo weight
function calcRevenue(distance: number, weight: number) {
  return distance * (15 + weight * 0.005);
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRupees(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type ReportsPageProps = {
  searchParams?: Promise<{
    vehicleId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function ReportsPage(props: ReportsPageProps) {
  const params = (await props.searchParams) ?? {};
  const filterVehicleId = params.vehicleId ?? "All";
  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(`${params.to}T23:59:59`) : undefined;

  // Build date filter for trips
  const dateFilter =
    fromDate || toDate
      ? {
          completedAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {};

  // Fetch all vehicles for filters dropdown
  const allVehicles = await prisma.vehicle.findMany({
    orderBy: { nameModel: "asc" },
  });

  // Vehicle filter predicate
  const vehicleWhere =
    filterVehicleId !== "All" ? { id: filterVehicleId } : {};

  // Fetch vehicles (optionally filtered) with all relations
  const vehicles = await prisma.vehicle.findMany({
    where: vehicleWhere,
    include: {
      trips: {
        where: { status: "COMPLETED", ...dateFilter },
        include: { driver: { select: { name: true } } },
        orderBy: { completedAt: "desc" },
      },
      fuelLogs: {
        where: fromDate || toDate
          ? { date: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
          : {},
      },
      maintenanceLogs: {
        where: fromDate || toDate
          ? { date: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
          : {},
      },
      expenses: {
        where: fromDate || toDate
          ? { date: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
          : {},
      },
    },
  });

  // Fetch all drivers with their trips (for driver performance table)
  const drivers = await prisma.driver.findMany({
    include: {
      trips: {
        where: { status: "COMPLETED", ...dateFilter },
        select: { id: true, plannedDistance: true, cargoWeight: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // ── Fleet-level aggregations ──────────────────────────────────────────────
  const totalVehiclesCount = allVehicles.length;
  const activeVehiclesCount = allVehicles.filter((v) => v.status === "ON_TRIP").length;
  const fleetUtilization =
    totalVehiclesCount > 0 ? (activeVehiclesCount / totalVehiclesCount) * 100 : 0;

  let totalDistanceCompleted = 0;
  let totalLitersConsumed = 0;
  let totalFuelCost = 0;
  let totalMaintCost = 0;
  let totalOtherCost = 0;
  let totalRevenueEarned = 0;
  let totalAcquisitionCost = 0;
  let totalTripsCompleted = 0;

  const vehicleStats = vehicles.map((v) => {
    const tripRevenue = v.trips.reduce(
      (sum, t) => sum + calcRevenue(t.plannedDistance, t.cargoWeight),
      0
    );
    const fuelCost = v.fuelLogs.reduce((sum, l) => sum + l.cost, 0);
    const fuelLiters = v.fuelLogs.reduce((sum, l) => sum + l.liters, 0);
    const maintCost = v.maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
    const otherCost = v.expenses.reduce((sum, e) => sum + e.amount, 0);
    const opCost = fuelCost + maintCost + otherCost;
    const distance = v.trips.reduce((sum, t) => sum + t.plannedDistance, 0);
    const efficiency = fuelLiters > 0 ? distance / fuelLiters : 0;
    const roi = v.acquisitionCost > 0 ? ((tripRevenue - opCost) / v.acquisitionCost) * 100 : 0;
    const profit = tripRevenue - opCost;

    totalDistanceCompleted += distance;
    totalLitersConsumed += fuelLiters;
    totalFuelCost += fuelCost;
    totalMaintCost += maintCost;
    totalOtherCost += otherCost;
    totalRevenueEarned += tripRevenue;
    totalAcquisitionCost += v.acquisitionCost;
    totalTripsCompleted += v.trips.length;

    return {
      id: v.id,
      nameModel: v.nameModel,
      registrationNumber: v.registrationNumber,
      status: v.status,
      efficiency,
      opCost,
      revenue: tripRevenue,
      profit,
      roi,
      trips: v.trips.length,
      fuelCost,
      maintCost,
      otherCost,
    };
  });

  const overallFuelEfficiency =
    totalLitersConsumed > 0 ? totalDistanceCompleted / totalLitersConsumed : 0;
  const overallOpCost = totalFuelCost + totalMaintCost + totalOtherCost;
  const overallROI =
    totalAcquisitionCost > 0
      ? ((totalRevenueEarned - overallOpCost) / totalAcquisitionCost) * 100
      : 0;

  // ── Driver performance ────────────────────────────────────────────────────
  const driverStats = drivers
    .map((d) => {
      const tripCount = d.trips.length;
      const revenue = d.trips.reduce(
        (sum, t) => sum + calcRevenue(t.plannedDistance, t.cargoWeight),
        0
      );
      const distance = d.trips.reduce((sum, t) => sum + t.plannedDistance, 0);
      return {
        id: d.id,
        name: d.name,
        safetyScore: d.safetyScore,
        status: d.status,
        tripCount,
        revenue,
        distance,
      };
    })
    .sort((a, b) => b.tripCount - a.tripCount);

  // ── Monthly revenue trend (last 7 months) ─────────────────────────────────
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenueMap: Record<string, number> = {};
  const now = new Date();
  const activeMonths: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const label = monthNames[d.getMonth()];
    activeMonths.push(label);
    monthlyRevenueMap[label] = 0;
  }

  // Aggregate revenue from all filtered vehicles' trips
  vehicles.forEach((v) =>
    v.trips.forEach((trip) => {
      if (trip.completedAt) {
        const label = monthNames[trip.completedAt.getMonth()];
        if (label in monthlyRevenueMap) {
          monthlyRevenueMap[label] += calcRevenue(trip.plannedDistance, trip.cargoWeight);
        }
      }
    })
  );

  const maxMonthlyRevenue = Math.max(...Object.values(monthlyRevenueMap), 1000);
  const monthlyBars = activeMonths.map((m) => {
    const rev = monthlyRevenueMap[m] || 0;
    const barHeight = `${(rev / maxMonthlyRevenue) * 160}px`;
    return { label: m, height: barHeight, value: rev };
  });

  // ── Cost breakdown percentages ─────────────────────────────────────────────
  const costBreakdown = [
    {
      label: "Fuel",
      value: totalFuelCost,
      pct: overallOpCost > 0 ? (totalFuelCost / overallOpCost) * 100 : 0,
      color: "bg-(--accent)",
    },
    {
      label: "Maintenance",
      value: totalMaintCost,
      pct: overallOpCost > 0 ? (totalMaintCost / overallOpCost) * 100 : 0,
      color: "bg-(--warning)",
    },
    {
      label: "Other",
      value: totalOtherCost,
      pct: overallOpCost > 0 ? (totalOtherCost / overallOpCost) * 100 : 0,
      color: "bg-(--info)",
    },
  ];

  // ── Top cost vehicles ──────────────────────────────────────────────────────
  const sortedByCost = [...vehicleStats].sort((a, b) => b.opCost - a.opCost);
  const maxVehicleCost = sortedByCost[0]?.opCost || 1000;
  const topCostBars = sortedByCost.slice(0, 5).map((v) => ({
    label: `${v.nameModel} (${v.registrationNumber})`,
    cost: fmtRupees(v.opCost),
    width: `${(v.opCost / maxVehicleCost) * 100}%`,
  }));

  // ── Recent trips (across all filtered vehicles) ───────────────────────────
  const recentTrips = vehicles
    .flatMap((v) =>
      v.trips.map((t) => ({
        id: t.id,
        source: t.source,
        destination: t.destination,
        vehicle: `${v.nameModel} (${v.registrationNumber})`,
        driver: (t as any).driver?.name ?? "—",
        distance: t.plannedDistance,
        cargo: t.cargoWeight,
        revenue: calcRevenue(t.plannedDistance, t.cargoWeight),
        status: t.status,
        completedAt: t.completedAt,
      }))
    )
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
    .slice(0, 15);

  // ── CSV export data ────────────────────────────────────────────────────────
  const csvRows = [
    ["Vehicle", "Reg No.", "Trips", "Distance (km)", "Fuel Efficiency (km/L)", "Fuel Cost (₹)", "Maintenance Cost (₹)", "Other Cost (₹)", "Total Op Cost (₹)", "Revenue (₹)", "Profit (₹)", "ROI (%)", "Status"],
    ...vehicleStats.map((v) => [
      v.nameModel,
      v.registrationNumber,
      v.trips,
      v.opCost > 0 ? totalDistanceCompleted.toFixed(1) : "0",
      v.efficiency.toFixed(2),
      v.fuelCost.toFixed(2),
      v.maintCost.toFixed(2),
      v.otherCost.toFixed(2),
      v.opCost.toFixed(2),
      v.revenue.toFixed(2),
      v.profit.toFixed(2),
      v.roi.toFixed(2),
      v.status,
    ]),
  ];
  const csvData = csvRows.map((r) => r.join(",")).join("\n");

  // ── KPI cards ─────────────────────────────────────────────────────────────
  const reportMetrics = [
    { label: "Total Revenue", value: fmtRupees(totalRevenueEarned), tone: "success" as const },
    { label: "Operational Cost", value: fmtRupees(overallOpCost), tone: "warning" as const },
    { label: "Fuel Efficiency", value: `${overallFuelEfficiency.toFixed(1)} km/L`, tone: "info" as const },
    { label: "Fleet Utilization", value: `${fleetUtilization.toFixed(0)}%`, tone: "accent" as const },
    { label: "Trips Completed", value: `${totalTripsCompleted}`, tone: "success" as const },
    { label: "Vehicle ROI", value: `${overallROI.toFixed(1)}%`, tone: overallROI >= 0 ? "info" as const : "danger" as const },
  ];

  return (
    <AppShell activePath="/reports" user={null}>
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Insights"
      />

      <StatGrid>
        {reportMetrics.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      {/* Filters & Export */}
      <ReportFilters vehicles={allVehicles} csvData={csvData} />

      {/* Revenue trend + Cost breakdown */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] mb-6">
        <Panel title="Monthly revenue trend" subtitle="Revenue from completed cargo trips — last 7 months.">
          <div className="flex h-56 items-end gap-3 px-2">
            {monthlyBars.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2 group relative">
                <div
                  className="w-full rounded-t-xl bg-(--accent) hover:brightness-110 transition-all duration-500 min-h-[4px]"
                  style={{ height: bar.height }}
                />
                <span className="text-xs text-(--muted)">{bar.label}</span>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 whitespace-nowrap bg-[#161618] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-medium text-white shadow-xl transition-all duration-200 z-10">
                  {fmtRupees(bar.value)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Cost breakdown" subtitle="Proportional split of total operational spend.">
          <div className="space-y-5">
            {costBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--muted) font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs">{fmtRupees(item.value)}</span>
                    <span className="text-(--muted-2) text-xs">({item.pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--muted)">Total Spend</span>
                <span className="text-white font-semibold">{fmtRupees(overallOpCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--muted)">Total Revenue</span>
                <span className="text-(--success) font-semibold">{fmtRupees(totalRevenueEarned)}</span>
              </div>
              <div className="border-t border-white/8 pt-2 flex items-center justify-between text-sm">
                <span className="text-(--muted)">Net Profit</span>
                <span className={`font-bold ${totalRevenueEarned - overallOpCost >= 0 ? "text-(--success)" : "text-(--danger)"}`}>
                  {fmtRupees(totalRevenueEarned - overallOpCost)}
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Top cost vehicles + Driver performance */}
      <div className="grid gap-5 xl:grid-cols-2 mb-6">
        <Panel title="Top cost vehicles" subtitle="Assets with the highest total operational spend.">
          <div className="space-y-4">
            {topCostBars.length === 0 ? (
              <div className="text-sm text-(--muted-2)">No vehicle cost data for the selected period.</div>
            ) : (
              topCostBars.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-(--muted)">
                    <span className="truncate pr-2 font-medium">{item.label}</span>
                    <span className="text-white font-mono shrink-0">{item.cost}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-(--warning) transition-all duration-500"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Driver performance" subtitle="Trips completed and revenue generated per driver.">
          {driverStats.length === 0 ? (
            <div className="text-sm text-(--muted-2)">No driver data available.</div>
          ) : (
            <Table
              columns={["Driver", "Trips", "Revenue", "Safety", "Status"]}
              rows={driverStats.slice(0, 8).map((d) => [
                <div key={`${d.id}-name`} className="font-medium text-white">{d.name}</div>,
                <span key={`${d.id}-trips`} className="font-mono text-sm">{d.tripCount}</span>,
                <span key={`${d.id}-rev`} className="font-mono text-sm">{fmtRupees(d.revenue)}</span>,
                <span
                  key={`${d.id}-safety`}
                  className={`font-semibold text-sm ${d.safetyScore >= 90 ? "text-(--success)" : d.safetyScore >= 70 ? "text-(--warning)" : "text-(--danger)"}`}
                >
                  {d.safetyScore.toFixed(0)}
                </span>,
                <Pill key={`${d.id}-status`} tone={getDriverStatusTone(d.status) as any}>
                  {d.status.replace("_", " ")}
                </Pill>,
              ])}
            />
          )}
        </Panel>
      </div>

      {/* Per-vehicle report */}
      <div className="mb-6">
      <Panel title="Per-vehicle analytics" subtitle="Full breakdown of efficiency, costs, revenue, and ROI per asset.">
        {vehicleStats.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2)">No vehicles found for the selected filters.</div>
        ) : (
          <Table
            columns={["Vehicle", "Trips", "Fuel Eff.", "Op Cost", "Revenue", "Profit", "ROI", "State"]}
            rows={vehicleStats.map((vehicle) => [
              <div key={`${vehicle.id}-v`}>
                <div className="font-semibold text-white">{vehicle.nameModel}</div>
                <div className="text-xs text-(--muted)">{vehicle.registrationNumber}</div>
              </div>,
              <span key={`${vehicle.id}-trips`} className="font-mono">{vehicle.trips}</span>,
              vehicle.efficiency > 0 ? `${vehicle.efficiency.toFixed(1)} km/L` : "—",
              fmtRupees(vehicle.opCost),
              fmtRupees(vehicle.revenue),
              <span
                key={`${vehicle.id}-profit`}
                className={vehicle.profit >= 0 ? "text-(--success) font-medium" : "text-(--danger) font-medium"}
              >
                {fmtRupees(vehicle.profit)}
              </span>,
              <span
                key={`${vehicle.id}-roi`}
                className={vehicle.roi >= 0 ? "text-(--success) font-medium" : "text-(--danger) font-medium"}
              >
                {vehicle.roi.toFixed(1)}%
              </span>,
              <Pill key={`${vehicle.id}-state`} tone={getStatusTone(vehicle.status) as any}>
                {vehicle.status.replace("_", " ")}
              </Pill>,
            ])}
          />
        )}
      </Panel>
      </div>

      {/* Recent trips breakdown */}
      <Panel title="Recent completed trips" subtitle="Latest trip records with per-trip revenue.">
        {recentTrips.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2)">No completed trips found for the selected filters.</div>
        ) : (
          <Table
            columns={["Route", "Vehicle", "Driver", "Distance", "Cargo", "Revenue", "Completed"]}
            rows={recentTrips.map((t) => [
              <div key={`${t.id}-route`}>
                <div className="font-medium text-white text-sm">{t.source}</div>
                <div className="text-xs text-(--muted)">→ {t.destination}</div>
              </div>,
              <span key={`${t.id}-veh`} className="text-sm">{t.vehicle}</span>,
              <span key={`${t.id}-drv`} className="text-sm">{t.driver}</span>,
              `${t.distance.toFixed(0)} km`,
              `${t.cargo.toFixed(0)} kg`,
              <span key={`${t.id}-rev`} className="text-(--success) font-mono font-medium text-sm">
                {fmtRupees(t.revenue)}
              </span>,
              formatDate(t.completedAt),
            ])}
          />
        )}
      </Panel>
    </AppShell>
  );
}