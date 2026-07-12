import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "../components/transit-shell";
import { MetricCard, Panel, PageHeader, Pill, StatGrid, Table } from "../components/transit-ui";
import { SESSION_COOKIE_NAME, readSessionToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

function toStatusTone(status: string) {
  return (
    {
      AVAILABLE: "success",
      ON_TRIP: "info",
      IN_SHOP: "warning",
      RETIRED: "danger",
      DRAFT: "muted",
      DISPATCHED: "info",
      COMPLETED: "success",
      CANCELLED: "danger"
    }[status] || "muted"
  ) as "success" | "info" | "warning" | "danger" | "muted";
}

function fmtRupees(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function calcRevenue(distance: number, weight: number) {
  return distance * (15 + weight * 0.005);
}

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = await readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!sessionToken) {
    redirect("/login");
  }

  // ── Vehicles ────────────────────────────────────────────────────────────────
  const vehicles = await prisma.vehicle.findMany();
  const totalVehicles = vehicles.length;
  const available = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const onTrip = vehicles.filter((v) => v.status === "ON_TRIP").length;
  const inShop = vehicles.filter((v) => v.status === "IN_SHOP").length;
  const retired = vehicles.filter((v) => v.status === "RETIRED").length;
  const totalActive = totalVehicles - retired;
  const fleetUtilization = totalActive > 0 ? Math.round((onTrip / totalActive) * 100) : 0;

  // ── Trips ────────────────────────────────────────────────────────────────────
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: { vehicle: true, driver: true }
  });
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const activeTrips = trips.filter((t) => t.status === "DISPATCHED").length;
  const pendingTrips = trips.filter((t) => t.status === "DRAFT").length;
  const completedCount = completedTrips.length;

  // Revenue from completed trips
  const totalRevenue = completedTrips.reduce(
    (sum, t) => sum + calcRevenue(t.plannedDistance, t.cargoWeight),
    0
  );

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const drivers = await prisma.driver.findMany();
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE").length;
  const driversOnDuty = drivers.filter((d) => d.status === "ON_TRIP").length;
  const suspendedDrivers = drivers.filter((d) => d.status === "SUSPENDED").length;

  // ── Financials ────────────────────────────────────────────────────────────────
  const fuelAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
  const maintAgg = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });
  const expAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalFuel = fuelAgg._sum.cost || 0;
  const totalMaint = maintAgg._sum.cost || 0;
  const totalOther = expAgg._sum.amount || 0;
  const totalOpCost = totalFuel + totalMaint + totalOther;
  const netProfit = totalRevenue - totalOpCost;

  // ── Maintenance queue ─────────────────────────────────────────────────────────
  const maintenanceQueue = await prisma.maintenanceLog.findMany({
    where: { isOpen: true },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" }
  });

  // ── KPI cards ─────────────────────────────────────────────────────────────────
  const topKpis = [
    { label: "Total Revenue", value: fmtRupees(totalRevenue), tone: "success" as const },
    { label: "Operational Cost", value: fmtRupees(totalOpCost), tone: "warning" as const },
    { label: "Net Profit", value: fmtRupees(netProfit), tone: netProfit >= 0 ? "success" as const : "danger" as const },
    { label: "Fleet Utilization", value: `${fleetUtilization}%`, tone: "accent" as const },
    { label: "Trips Completed", value: completedCount.toString(), tone: "success" as const },
    { label: "Active Trips", value: activeTrips.toString(), tone: "info" as const },
    { label: "Pending Trips", value: pendingTrips.toString(), tone: "neutral" as const },
    { label: "Drivers On Duty", value: driversOnDuty.toString(), tone: "neutral" as const }
  ];

  const vehicleStatusBars = [
    { label: "Available", count: available, pct: totalActive > 0 ? (available / totalActive) * 100 : 0, fill: "bg-[var(--success)]" },
    { label: "On Trip",   count: onTrip,   pct: totalActive > 0 ? (onTrip / totalActive) * 100 : 0,   fill: "bg-[var(--info)]" },
    { label: "In Shop",   count: inShop,   pct: totalActive > 0 ? (inShop / totalActive) * 100 : 0,   fill: "bg-[var(--warning)]" },
    { label: "Retired",   count: retired,  pct: totalVehicles > 0 ? (retired / totalVehicles) * 100 : 0, fill: "bg-[var(--danger)]" }
  ];

  const costBreakdown = [
    { label: "Fuel",        value: totalFuel,  pct: totalOpCost > 0 ? (totalFuel / totalOpCost) * 100 : 0,  fill: "bg-[var(--accent)]" },
    { label: "Maintenance", value: totalMaint, pct: totalOpCost > 0 ? (totalMaint / totalOpCost) * 100 : 0, fill: "bg-[var(--warning)]" },
    { label: "Other",       value: totalOther, pct: totalOpCost > 0 ? (totalOther / totalOpCost) * 100 : 0, fill: "bg-[var(--info)]" }
  ];

  return (
    <AppShell activePath="/">
      <PageHeader
        eyebrow="Dashboard"
        title="Command Center"
      />

      {/* KPI grid */}
      <StatGrid>
        {topKpis.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </StatGrid>

      {/* Row 2: Recent trips + vehicle status */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr] mb-5">
        <Panel title="Recent trips" subtitle="Latest dispatch activity and completion status">
          {trips.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-4">No trips yet. <Link href="/trips" className="text-[var(--accent)] hover:underline">Create one →</Link></div>
          ) : (
            <Table
              columns={["Route", "Vehicle", "Driver", "Distance", "Status"]}
              rows={trips.slice(0, 6).map((trip) => [
                <div key={`r-${trip.id}`}>
                  <div className="font-medium text-white text-sm">{trip.source} → {trip.destination}</div>
                  <div className="text-[10px] text-[var(--muted)] font-mono">{trip.id.substring(0, 8)}</div>
                </div>,
                <div key={`v-${trip.id}`}>
                  <div className="text-sm">{trip.vehicle.nameModel}</div>
                  <div className="text-xs text-[var(--muted)]">{trip.vehicle.registrationNumber}</div>
                </div>,
                <span key={`d-${trip.id}`} className="text-sm">{trip.driver.name}</span>,
                `${trip.plannedDistance} km`,
                <Pill key={`s-${trip.id}`} tone={toStatusTone(trip.status)}>{trip.status}</Pill>
              ])}
            />
          )}
        </Panel>

        <Panel title="Vehicle status" subtitle="Availability mix across the fleet">
          <div className="space-y-4 mb-5">
            {vehicleStatusBars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                  <span>{bar.label}</span>
                  <span className="font-mono">{bar.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/6">
                  <div className={`h-2 rounded-full ${bar.fill} transition-all`} style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Total Fleet</span>
              <span className="font-mono font-semibold text-white">{totalVehicles} vehicles</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mt-1">
              <span>Total Drivers</span>
              <span className="font-mono font-semibold text-white">{totalDrivers} drivers ({availableDrivers} available)</span>
            </div>
            {suspendedDrivers > 0 && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[var(--danger)]">Suspended Drivers</span>
                <span className="font-mono font-semibold text-[var(--danger)]">{suspendedDrivers}</span>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Row 3: Cost breakdown + Maintenance queue */}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr] mb-5">
        <Panel title="Cost breakdown" subtitle="Operational spend by category">
          <div className="space-y-4 mb-4">
            {costBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{item.label}</span>
                  <span className="font-mono text-white">{fmtRupees(item.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/6">
                  <div className={`h-1.5 rounded-full ${item.fill}`} style={{ width: `${item.pct.toFixed(1)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Total Cost</span>
              <span className="font-mono text-[var(--warning)] font-semibold">{fmtRupees(totalOpCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Total Revenue</span>
              <span className="font-mono text-[var(--success)] font-semibold">{fmtRupees(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-white/8 pt-2">
              <span className="font-semibold text-white">Net Profit</span>
              <span className={`font-mono font-bold ${netProfit >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {fmtRupees(netProfit)}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Maintenance queue" subtitle="Active service records that keep vehicles in shop">
          {maintenanceQueue.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-4">✅ No active maintenance logs — all vehicles are clear.</div>
          ) : (
            <Table
              columns={["Vehicle", "Service", "Date", "Cost", "State"]}
              rows={maintenanceQueue.map((record) => [
                <div key={`mv-${record.id}`}>
                  <div className="font-semibold text-white text-sm">{record.vehicle.nameModel}</div>
                  <div className="text-xs text-[var(--muted)]">{record.vehicle.registrationNumber}</div>
                </div>,
                record.description,
                new Date(record.date).toLocaleDateString("en-IN"),
                fmtRupees(record.cost),
                <Pill key={`ms-${record.id}`} tone="warning">Active</Pill>
              ])}
            />
          )}
        </Panel>
      </div>

      {/* Row 4: Fleet snapshot */}
      <Panel title="Fleet snapshot" subtitle="All vehicles with current status">
        {vehicles.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-4">No vehicles. <Link href="/fleet" className="text-[var(--accent)] hover:underline">Register one →</Link></div>
        ) : (
          <Table
            columns={["Reg No.", "Vehicle", "Type", "Capacity", "Odometer", "Status"]}
            rows={vehicles.map((vehicle) => [
              <span key={`r-${vehicle.id}`} className="font-mono text-xs text-[var(--muted)]">{vehicle.registrationNumber}</span>,
              <span key={`n-${vehicle.id}`} className="font-medium text-white">{vehicle.nameModel}</span>,
              vehicle.type,
              `${vehicle.maxLoadCapacity} kg`,
              `${vehicle.odometer.toLocaleString("en-IN")} km`,
              <Pill key={`p-${vehicle.id}`} tone={toStatusTone(vehicle.status)}>{vehicle.status.replace("_", " ")}</Pill>
            ])}
          />
        )}
      </Panel>
    </AppShell>
  );
}