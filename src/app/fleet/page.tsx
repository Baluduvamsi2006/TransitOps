import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { AddVehicleButton } from "./add-vehicle-button";
import { VehicleFilters } from "./vehicle-filters";
import { StatusUpdater } from "./status-updater";

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

export default async function FleetPage(props: { searchParams?: Promise<{ search?: string; type?: string; status?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" }
  });

  let filteredVehicles = vehicles;
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
            columns={["Reg no.", "Vehicle", "Type", "Capacity", "Odometer", "Cost", "Status"]}
            rows={filteredVehicles.map((vehicle) => [
              vehicle.registrationNumber,
              vehicle.nameModel,
              vehicle.type,
              `${vehicle.maxLoadCapacity} kg`,
              `${vehicle.odometer} km`,
              `₹${vehicle.acquisitionCost.toLocaleString()}`,
              <StatusUpdater key={`${vehicle.id}-status`} vehicleId={vehicle.id} initialStatus={vehicle.status} />
            ])}
          />
        </Panel>
      </div>
    </AppShell>
  );
}