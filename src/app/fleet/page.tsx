import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { AddVehicleButton } from "./add-vehicle-button";

function getStatusTone(status: string) {
  switch (status) {
    case "AVAILABLE": return "success";
    case "ON_TRIP": return "info";
    case "IN_SHOP": return "warning";
    case "RETIRED": return "danger";
    default: return "muted";
  }
}

export default async function FleetPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" }
  });

  const totalCount = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length;
  const inShopCount = vehicles.filter(v => v.status === "IN_SHOP").length;
  const retiredCount = vehicles.filter(v => v.status === "RETIRED").length;
  const onTripCount = vehicles.filter(v => v.status === "ON_TRIP").length;

  const fleetSummary = [
    { label: "Vehicles Registered", value: totalCount.toString(), tone: "accent" as const },
    { label: "Available for Dispatch", value: availableCount.toString(), tone: "success" as const },
    { label: "In Shop", value: inShopCount.toString(), tone: "warning" as const },
    { label: "Retired Assets", value: retiredCount.toString(), tone: "danger" as const }
  ];

  const vehicleStatusBars = [
    { label: "Available", count: availableCount, width: `${totalCount ? (availableCount / totalCount) * 100 : 0}%`, fill: "bg-(--success)" },
    { label: "On Trip", count: onTripCount, width: `${totalCount ? (onTripCount / totalCount) * 100 : 0}%`, fill: "bg-(--info)" },
    { label: "In Shop", count: inShopCount, width: `${totalCount ? (inShopCount / totalCount) * 100 : 0}%`, fill: "bg-(--warning)" },
    { label: "Retired", count: retiredCount, width: `${totalCount ? (retiredCount / totalCount) * 100 : 0}%`, fill: "bg-(--danger)" }
  ];

  return (
    <AppShell activePath="/fleet">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Fleet Registry"
          title="Vehicles and asset lifecycle"
          description="A master list for registration, type, capacity, odometer tracking, acquisition cost, and operational state."
        />
        <div className="mt-4 sm:mt-8">
          <AddVehicleButton />
        </div>
      </div>

      <StatGrid>
        {fleetSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel title="Vehicle list" subtitle="Search, filter, and inspect the live fleet inventory.">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-(--muted)">Search reg / model</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-(--muted)">Type: All</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-(--muted)">Status: All</div>
          </div>

          <Table
            columns={["Reg no.", "Vehicle", "Type", "Capacity", "Odometer", "Cost", "Status"]}
            rows={vehicles.map((vehicle) => [
              vehicle.registrationNumber,
              vehicle.nameModel,
              vehicle.type,
              `${vehicle.maxLoadCapacity} kg`,
              `${vehicle.odometer} km`,
              `₹${vehicle.acquisitionCost.toLocaleString()}`,
              <Pill key={`${vehicle.id}-status`} tone={getStatusTone(vehicle.status)}>{vehicle.status.replace("_", " ")}</Pill>
            ])}
          />
        </Panel>

        <Panel title="Availability mix" subtitle="Live status split used for dispatch selection and dashboard KPIs.">
          <div className="space-y-4">
            {vehicleStatusBars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-(--muted)">
                  <span>{bar.label}</span>
                  <span>{bar.count}</span>
                </div>
                <div className="h-2 rounded-full bg-(--panel-strong)">
                  <div className={`h-2 rounded-full ${bar.fill}`} style={{ width: bar.width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/6 p-4 text-sm leading-7 text-(--muted-2)">
            Retired and in-shop vehicles are displayed here for lifecycle visibility but are excluded from dispatch selection in the next phase.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}