import Link from "next/link";
import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { SubmitButton } from "../../components/submit-button";
import { prisma } from "../../lib/prisma";
import { createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip } from "./actions";
import { TripStatus } from "@prisma/client";
import { TripFilters } from "./trip-filters";

type TripsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    complete?: string;
    error?: string;
    message?: string;
  }>;
};

function toStatusTone(status: string) {
  return {
    DRAFT: "muted",
    DISPATCHED: "info",
    COMPLETED: "success",
    CANCELLED: "danger"
  }[status] as "muted" | "info" | "success" | "danger";
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = (await searchParams) ?? {};
  const searchTerm = (params.search ?? "").trim().toLowerCase();
  const filterStatus = params.status ?? "All";
  
  // Manage rights are enabled by default since authentication is handled externally
  const canManage = true;

  // Fetch all trips with vehicle and driver info
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Apply search and status filtering
  let visibleTrips = trips;
  if (searchTerm) {
    visibleTrips = visibleTrips.filter((trip) => {
      const haystack = [
        trip.id,
        trip.source,
        trip.destination,
        trip.vehicle.registrationNumber,
        trip.vehicle.nameModel,
        trip.driver.name,
        trip.status,
        trip.cargoWeight.toString(),
        trip.plannedDistance.toString()
      ].join(" ").toLowerCase();

      return haystack.includes(searchTerm);
    });
  }
  if (filterStatus && filterStatus !== "All") {
    visibleTrips = visibleTrips.filter((trip) => trip.status === filterStatus);
  }

  // Filter available vehicles and drivers for dropdowns
  const availableVehicles = await prisma.vehicle.findMany({
    where: {
      status: "AVAILABLE"
    },
    orderBy: {
      nameModel: "asc"
    }
  });

  const now = new Date();
  const availableDrivers = await prisma.driver.findMany({
    where: {
      status: "AVAILABLE",
      licenseExpiryDate: {
        gt: now
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  const tripCompleteId = params.complete;
  const targetCompleteTrip = tripCompleteId ? trips.find((t) => t.id === tripCompleteId) : undefined;

  // Compute KPIs based on loaded database records
  const draftTripsCount = trips.filter((t) => t.status === TripStatus.DRAFT).length;
  const dispatchedTripsCount = trips.filter((t) => t.status === TripStatus.DISPATCHED).length;
  const completedTripsCount = trips.filter((t) => t.status === TripStatus.COMPLETED).length;
  const cancelledTripsCount = trips.filter((t) => t.status === TripStatus.CANCELLED).length;

  const tripKpis = [
    { label: "Draft Trips", value: draftTripsCount, tone: "neutral" as const },
    { label: "Dispatched", value: dispatchedTripsCount, tone: "info" as const },
    { label: "Completed", value: completedTripsCount, tone: "success" as const },
    { label: "Cancelled", value: cancelledTripsCount, tone: "danger" as const }
  ];

  const message = params.message;
  const error = params.error;

  return (
    <AppShell activePath="/trips">
      <PageHeader
        eyebrow="Dispatch & Routing"
        title="Active Trips"
      />

      <StatGrid>
        {tripKpis.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      {(message || error) && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? "border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] text-(--danger)" : "border-[rgba(92,191,118,0.35)] bg-[rgba(92,191,118,0.12)] text-(--success)"}`}>
          {error ?? message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr] mb-5">
        
        {/* Trip Creation Form or Completion Drawer */}
        {canManage ? (
          targetCompleteTrip ? (
            <Panel title="Complete Trip" subtitle={`Enter final trip details for vehicle ${targetCompleteTrip.vehicle.nameModel} (${targetCompleteTrip.vehicle.registrationNumber}).`}>
              <form action={completeTrip} className="space-y-4">
                <input type="hidden" name="id" value={targetCompleteTrip.id} />
                
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">
                    Final Odometer (km) (Current: {targetCompleteTrip.vehicle.odometer} km)
                  </span>
                  <input
                    type="number"
                    name="finalOdometer"
                    min={targetCompleteTrip.vehicle.odometer}
                    defaultValue={targetCompleteTrip.vehicle.odometer + targetCompleteTrip.plannedDistance}
                    required
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Fuel Liters</span>
                    <input
                      type="number"
                      name="fuelLiters"
                      min="0"
                      step="0.1"
                      defaultValue="0"
                      className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Fuel Cost ($)</span>
                    <input
                      type="number"
                      name="fuelCost"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <SubmitButton
                    label="Complete Trip"
                    className="rounded-2xl bg-(--success) px-5 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
                  />
                  <Link
                    href="/trips"
                    className="rounded-2xl border border-white/8 bg-white/6 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </Panel>
          ) : (
            <Panel title="Draft a new trip" subtitle="Assign available vehicles and drivers that satisfy operational rules.">
              <form action={createTrip} className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Source</span>
                  <input
                    name="source"
                    required
                    placeholder="Northbridge Depot"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  />
                </label>

                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Destination</span>
                  <input
                    name="destination"
                    required
                    placeholder="Ashapiladad Hub"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  />
                </label>

                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Vehicle</span>
                  <select
                    name="vehicleId"
                    required
                    style={{ colorScheme: "dark" }}
                    className="w-full rounded-2xl border border-white/8 bg-(--panel) px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  >
                    <option value="">Select available vehicle...</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.nameModel} ({vehicle.registrationNumber}) - Max: {vehicle.maxLoadCapacity}kg
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Driver</span>
                  <select
                    name="driverId"
                    required
                    style={{ colorScheme: "dark" }}
                    className="w-full rounded-2xl border border-white/8 bg-(--panel) px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  >
                    <option value="">Select available driver...</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} (Safety: {driver.safetyScore}%)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Cargo Weight (kg)</span>
                  <input
                    type="number"
                    name="cargoWeight"
                    required
                    min="0"
                    placeholder="450"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  />
                </label>

                <label className="block space-y-2 md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Planned Distance (km)</span>
                  <input
                    type="number"
                    name="plannedDistance"
                    required
                    min="0"
                    placeholder="96"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                  />
                </label>



                <div className="md:col-span-2 pt-2">
                  <SubmitButton
                    label="Draft Trip"
                    className="rounded-2xl bg-(--accent) px-5 py-3 text-sm font-semibold text-(--accent-ink) hover:brightness-110 transition"
                  />
                </div>
              </form>
            </Panel>
          )
        ) : (
          <Panel title="Draft Access Restricted" subtitle="Only Dispatchers and Fleet Managers can create or manage trips.">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-5 text-sm text-(--muted-2) leading-7">
              Your active role has view-only access to trips. You can review current dispatches and status logs in the roster below.
            </div>
          </Panel>
        )}

        <Panel title="Operational rules" subtitle="These requirements are enforced on dispatch and completion.">
          <div className="space-y-4 text-sm leading-7 text-(--muted-2)">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <span className="font-semibold text-white">Asset Lock</span>: Dispatching flips both driver and vehicle status to <Pill tone="info">ON TRIP</Pill> and completes restore them to <Pill tone="success">AVAILABLE</Pill>.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <span className="font-semibold text-white">Capacity Cap</span>: Cargo weight cannot exceed the vehicle&apos;s maximum load limit.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <span className="font-semibold text-white">License Compliance</span>: Drivers with expired licenses or Suspended status are barred from assignment.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Live trips" subtitle="Draft, dispatched, completed, and cancelled trips.">
        <TripFilters />
        {visibleTrips.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2) mb-4">No trips match your search filters.</div>
        ) : null}
        <Table
          columns={["Route", "Vehicle", "Driver", "Weight", "Distance", "Status", "Actions"]}
          rows={visibleTrips.map((trip) => [
            <div key={`${trip.id}-route`}>
              <div className="font-semibold text-white">{trip.source} → {trip.destination}</div>
              <div className="text-[10px] text-(--muted) font-mono">{trip.id}</div>
            </div>,
            <div key={`${trip.id}-vehicle`}>
              <div>{trip.vehicle.nameModel}</div>
              <div className="text-xs text-(--muted)">{trip.vehicle.registrationNumber}</div>
            </div>,
            <div key={`${trip.id}-driver`}>
              <div>{trip.driver.name}</div>
            </div>,
            `${trip.cargoWeight} kg`,
            `${trip.plannedDistance} km`,
            <Pill key={`${trip.id}-status`} tone={toStatusTone(trip.status)}>{trip.status}</Pill>,
            <div key={`${trip.id}-actions`} className="flex justify-end gap-2">
              {canManage && trip.status === TripStatus.DRAFT && (
                <>
                  <form action={dispatchTrip}>
                    <input type="hidden" name="id" value={trip.id} />
                    <SubmitButton
                      label="Dispatch"
                      className="rounded-full border border-[rgba(79,143,209,0.35)] bg-[rgba(79,143,209,0.12)] px-3 py-1.5 text-xs font-semibold text-(--info) hover:bg-[rgba(79,143,209,0.18)] transition"
                    />
                  </form>
                  <form action={cancelTrip}>
                    <input type="hidden" name="id" value={trip.id} />
                    <SubmitButton
                      label="Cancel"
                      className="rounded-full border border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] px-3 py-1.5 text-xs font-semibold text-(--danger) hover:bg-[rgba(217,80,63,0.18)] transition"
                    />
                  </form>
                </>
              )}
              {canManage && trip.status === TripStatus.DISPATCHED && (
                <>
                  <Link
                    href={`/trips?complete=${trip.id}`}
                    className="rounded-full border border-[rgba(92,191,118,0.35)] bg-[rgba(92,191,118,0.12)] px-3 py-1.5 text-xs font-semibold text-(--success) hover:bg-[rgba(92,191,118,0.18)] transition"
                  >
                    Complete
                  </Link>
                  <form action={cancelTrip}>
                    <input type="hidden" name="id" value={trip.id} />
                    <SubmitButton
                      label="Cancel"
                      className="rounded-full border border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] px-3 py-1.5 text-xs font-semibold text-(--danger) hover:bg-[rgba(217,80,63,0.18)] transition"
                    />
                  </form>
                </>
              )}
              {canManage && (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) && (
                <form action={deleteTrip}>
                  <input type="hidden" name="id" value={trip.id} />
                  <SubmitButton
                    label="Delete"
                    className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-xs font-semibold text-(--muted) hover:bg-white/10 transition"
                  />
                </form>
              )}
              {!canManage && (
                <span className="text-xs text-(--muted) italic">View only</span>
              )}
            </div>
          ])}
          getRowClassName={() => (searchTerm ? "bg-[rgba(255,255,255,0.02)]" : "")}
        />
      </Panel>
    </AppShell>
  );
}