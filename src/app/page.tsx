import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "../components/transit-shell";
import { MetricCard, Panel, PageHeader, Pill, StatGrid, Table } from "../components/transit-ui";
import { DashboardFilters } from "../components/dashboard-filters";
import { SESSION_COOKIE_NAME, readSessionToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { TripStatus, VehicleStatus } from "@prisma/client";

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

export const dynamic = "force-dynamic";

type DashboardProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    region?: string;
  }>;
};

export default async function Home({ searchParams }: DashboardProps) {
  const cookieStore = await cookies();
  const sessionToken = await readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!sessionToken) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const vType = params.type && params.type !== "All" ? params.type : undefined;
  const vStatus = params.status && params.status !== "All" ? params.status as VehicleStatus : undefined;
  const vRegion = params.region && params.region !== "All" ? params.region : undefined;

  // 1. Vehicles
  const vehicleWhere = {
    ...(vType ? { type: vType } : {}),
    ...(vStatus ? { status: vStatus } : {}),
  };

  const vehicles = await prisma.vehicle.findMany({ where: vehicleWhere });
  const totalActive = vehicles.filter((v) => v.status !== "RETIRED").length;
  const available = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const inShop = vehicles.filter((v) => v.status === "IN_SHOP").length;
  const onTrip = vehicles.filter((v) => v.status === "ON_TRIP").length;
  const retired = vehicles.filter((v) => v.status === "RETIRED").length;

  const fleetUtilization = totalActive > 0 ? ((onTrip / totalActive) * 100).toFixed(0) : "0";

  // 2. Trips
  // Rough textual region match on source or destination for Trip-based filtering
  const tripWhere = vRegion ? {
    OR: [
      { source: { contains: vRegion, mode: "insensitive" as const } },
      { destination: { contains: vRegion, mode: "insensitive" as const } }
    ]
  } : {};

  const trips = await prisma.trip.findMany({
    where: tripWhere,
    orderBy: { createdAt: "desc" },
    include: { vehicle: true, driver: true }
  });
  const activeTrips = trips.filter((t) => t.status === "DISPATCHED").length;
  const pendingTrips = trips.filter((t) => t.status === "DRAFT").length;

  // 3. Drivers
  const driversOnDuty = await prisma.driver.count({ where: { status: "ON_TRIP" } });

  // 4. Financials (Operational Cost)
  const fuelAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
  const maintAgg = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });
  const expAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalCost = (fuelAgg._sum.cost || 0) + (maintAgg._sum.cost || 0) + (expAgg._sum.amount || 0);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const dashboardKpis = [
    { label: "Active Vehicles", value: totalActive.toString(), tone: "accent" as const },
    { label: "Available Vehicles", value: available.toString(), tone: "success" as const },
    { label: "In Maintenance", value: inShop.toString(), tone: "warning" as const },
    { label: "Active Trips", value: activeTrips.toString(), tone: "info" as const },
    { label: "Pending Trips", value: pendingTrips.toString(), tone: "neutral" as const },
    { label: "Drivers On Duty", value: driversOnDuty.toString(), tone: "neutral" as const },
    { label: "Fleet Utilization", value: `${fleetUtilization}%`, tone: "accent" as const },
    { label: "Operational Cost", value: formatCurrency(totalCost), tone: "warning" as const }
  ];

  const vehicleStatusBars = [
    { label: "Available", count: available, width: totalActive ? `${(available / totalActive) * 100}%` : "0%", fill: "bg-[var(--success)]" },
    { label: "On Trip", count: onTrip, width: totalActive ? `${(onTrip / totalActive) * 100}%` : "0%", fill: "bg-[var(--info)]" },
    { label: "In Shop", count: inShop, width: totalActive ? `${(inShop / totalActive) * 100}%` : "0%", fill: "bg-[var(--warning)]" },
    { label: "Retired", count: retired, width: vehicles.length ? `${(retired / vehicles.length) * 100}%` : "0%", fill: "bg-[var(--danger)]" }
  ];

  const maintenanceQueue = await prisma.maintenanceLog.findMany({
    where: { isOpen: true },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" }
  });

  // 5. Bonus Analytics: Expired Licenses & Top Maintenance Cost Vehicles
  const expiredLicenses = await prisma.driver.count({
    where: { licenseExpiryDate: { lt: new Date() } }
  });

  const maintByVehicle = await prisma.maintenanceLog.groupBy({
    by: ['vehicleId'],
    _sum: { cost: true },
    orderBy: { _sum: { cost: 'desc' } },
    take: 3
  });

  const topMaintVehicles = await Promise.all(
    maintByVehicle.map(async (m) => {
      const v = await prisma.vehicle.findUnique({ where: { id: m.vehicleId } });
      return { vehicle: v!, totalCost: m._sum.cost || 0 };
    })
  );

  return (
    <AppShell activePath="/">
      <PageHeader
        eyebrow="Dashboard"
        title="Fleet command center"
        description="A live reference operations dashboard for vehicle control, dispatch visibility, maintenance, and cost tracking."
      />

      {expiredLicenses > 0 && (
        <div className="mb-6 rounded-2xl border border-[color:rgba(217,80,63,0.35)] bg-[color:rgba(217,80,63,0.12)] p-4 text-[var(--danger)] animate-fade-up">
          <strong className="block text-white mb-1">Compliance Alert</strong>
          {expiredLicenses} driver{expiredLicenses === 1 ? '' : 's'} {expiredLicenses === 1 ? 'has' : 'have'} expired licenses. Dispatch limits automatically enforced.
        </div>
      )}

      <DashboardFilters />

      <StatGrid>
        {dashboardKpis.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="Recent trips" subtitle="Dispatch activity and completion status">
          {trips.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-4">No trips currently assigned.</div>
          ) : (
            <Table
              columns={["Trip", "Vehicle", "Driver", "Status", "Notes"]}
              rows={trips.slice(0, 4).map((trip) => [
                <span key={`tid-${trip.id}`} className="font-mono text-xs">{trip.id.substring(0, 8)}</span>,
                trip.vehicle.registrationNumber,
                trip.driver.name,
                <Pill key={`${trip.id}-status`} tone={toStatusTone(trip.status)}>{trip.status}</Pill>,
                <span key={`tdst-${trip.id}`} className="truncate max-w-[120px] inline-block" title={`${trip.source} → ${trip.destination}`}>
                  {trip.source} → {trip.destination}
                </span>
              ])}
            />
          )}
        </Panel>

        <Panel title="Vehicle status" subtitle="Availability mix across the live fleet">
          <div className="space-y-4">
            {vehicleStatusBars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
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

      <Panel title="Fleet snapshot" subtitle="Vehicles by status">
        {vehicles.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-4">No vehicles documented in fleet.</div>
        ) : (
          <Table
            columns={["Reg no.", "Vehicle", "Type", "Capacity", "Status"]}
            rows={vehicles.slice(0, 6).map((vehicle) => [
              vehicle.registrationNumber,
              vehicle.nameModel,
              vehicle.type,
              `${vehicle.maxLoadCapacity} kg`,
              <Pill key={`${vehicle.id}-pill`} tone={toStatusTone(vehicle.status)}>{vehicle.status.replace("_", " ")}</Pill>
            ])}
          />
        )}
      </Panel>

      <Panel title="Maintenance queue" subtitle="Active service records that keep vehicles in shop">
        {maintenanceQueue.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-4">No active maintenance logs.</div>
        ) : (
          <Table
            columns={["Vehicle", "Service", "Date", "Cost", "State"]}
            rows={maintenanceQueue.map((record) => [
              record.vehicle.registrationNumber,
              record.description,
              new Date(record.date).toLocaleDateString(),
              formatCurrency(record.cost),
              <Pill key={`${record.id}-maint`} tone="warning">Active</Pill>
            ])}
          />
        )}
      </Panel>

      <Panel title="Highest Maintenance Assets" subtitle="Analytics on which vehicles cost the most to maintain globally">
        {topMaintVehicles.length === 0 ? (
          <div className="text-sm text-[var(--muted)] py-4">No maintenance data available.</div>
        ) : (
          <Table
            columns={["Vehicle", "Registration", "Total Maint. Cost"]}
            rows={topMaintVehicles.map(m => [
              m.vehicle.nameModel,
              m.vehicle.registrationNumber,
              <span key={`cost-${m.vehicle.id}`} className="font-mono text-[var(--danger)]">
                {formatCurrency(m.totalCost)}
              </span>
            ])}
          />
        )}
      </Panel>
    </AppShell>
  );
}