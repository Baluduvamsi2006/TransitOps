import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { AddVehicleButton } from "./add-vehicle-button";
import { VehicleFilters } from "./vehicle-filters";
import { VehicleActionMenu } from "./vehicle-action-menu";

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

export default async function FleetPage(props: { searchParams?: Promise<{ search?: string; type?: string; status?: string; sort?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      fuelLogs: true,
      maintenanceLogs: true,
      expenses: true,
    }
  });

  let filteredVehicles = vehicles.map(v => {
    const totalCost = v.acquisitionCost 
      + v.fuelLogs.reduce((sum, log) => sum + log.cost, 0)
      + v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0)
      + v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { ...v, totalCost };
  });

  if (searchParams?.search) {
    const s = searchParams.search.toLowerCase();
    filteredVehicles = filteredVehicles.filter(v => v.registrationNumber.toLowerCase().includes(s) || v.nameModel.toLowerCase().includes(s));
  }
  if (searchParams?.type && searchParams.type !== "All") {
    filteredVehicles = filteredVehicles.filter(v => v.type.trim().toLowerCase() === String(searchParams.type).trim().toLowerCase());
  }
  if (searchParams?.status && searchParams.status !== "All") {
    filteredVehicles = filteredVehicles.filter(v => v.status.trim().toLowerCase() === String(searchParams.status).trim().toLowerCase());
  }

  const sort = searchParams?.sort || "newest";
  if (sort === "capacity-desc") {
    filteredVehicles.sort((a, b) => b.maxLoadCapacity - a.maxLoadCapacity);
  } else if (sort === "odometer-desc") {
    filteredVehicles.sort((a, b) => b.odometer - a.odometer);
  } else if (sort === "cost-desc") {
    filteredVehicles.sort((a, b) => b.totalCost - a.totalCost);
  } else {
    filteredVehicles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return (
    <AppShell activePath="/fleet">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Fleet Registry"
          title="Vehicle Registry"
        />
        <div className="mt-4 sm:mt-0">
          <AddVehicleButton />
        </div>
      </div>

      <div className="mt-8">
        <Panel title="Vehicle list">
          <VehicleFilters />

          <Table
            columns={["Reg no.", "Vehicle", "Type", "Capacity", "Odometer", "Total Cost", "Status", ""]}
            rows={filteredVehicles.map((vehicle) => {
              const totalCost = vehicle.acquisitionCost 
                + vehicle.fuelLogs.reduce((sum, log) => sum + log.cost, 0)
                + vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0)
                + vehicle.expenses.reduce((sum, exp) => sum + exp.amount, 0);

              return [
                vehicle.registrationNumber,
                vehicle.nameModel,
                vehicle.type,
                `${vehicle.maxLoadCapacity} kg`,
                `${vehicle.odometer} km`,
                `₹${totalCost.toLocaleString()}`,
                <Pill key={`${vehicle.id}-status`} tone={getStatusTone(vehicle.status) as any}>
                  {vehicle.status.replace("_", " ")}
                </Pill>,
                <VehicleActionMenu key={`${vehicle.id}-actions`} vehicle={vehicle} />
              ];
            })}
          />
        </Panel>
      </div>
    </AppShell>
  );
}