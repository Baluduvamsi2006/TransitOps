import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { routeSummary, tripRows } from "../../lib/transitops-data";

const tripKpis = [
  { label: "Draft Trips", value: "4", tone: "neutral" as const },
  { label: "Dispatched", value: "9", tone: "info" as const },
  { label: "Completed", value: "12", tone: "success" as const },
  { label: "Cancelled", value: "3", tone: "danger" as const }
];

type TripsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = (await searchParams) ?? {};
  const searchTerm = (params.q ?? "").trim().toLowerCase();
  const visibleTrips = searchTerm
    ? tripRows.filter((trip) => {
        const haystack = [trip.id, trip.route, trip.vehicle, trip.driver, trip.status, trip.weight, trip.distance].join(" ").toLowerCase();
        return haystack.includes(searchTerm);
      })
    : tripRows;

  return (
    <AppShell activePath="/trips">
      <PageHeader
        eyebrow="Trip Management"
        title="Dispatch, complete, and cancel trips"
        description="A route control surface for drafting shipments, assigning available resources, and reviewing live trip state."
      />

      <StatGrid>
        {tripKpis.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr]">
        <Panel title="Trip draft board" subtitle="In the database-backed version this will validate capacity, driver status, and vehicle availability before dispatch.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Source</p>
              <p className="mt-2 text-sm text-white">Northbridge Depot</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Destination</p>
              <p className="mt-2 text-sm text-white">Ashapiladad Hub</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Vehicle</p>
              <p className="mt-2 text-sm text-white">Available fleet pool only</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Driver</p>
              <p className="mt-2 text-sm text-white">Available, valid license only</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Cargo weight</p>
              <p className="mt-2 text-sm text-white">450 kg</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Distance</p>
              <p className="mt-2 text-sm text-white">96 km</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/8 bg-white/6 p-4 text-sm leading-7 text-[var(--muted-2)]">
            Draft trips will later be promoted to Dispatched only when the selected driver and vehicle satisfy all business rules.
          </div>
        </Panel>

        <Panel title="Operational rules" subtitle="These notes mirror the backend behavior that will be wired later.">
          <div className="space-y-4 text-sm leading-7 text-[var(--muted-2)]">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Retired or in-shop vehicles never enter the dispatch pool.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Drivers with expired licenses or suspended status are excluded from assignment.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Dispatching flips both vehicle and driver to On Trip, and completion restores them to Available.</div>
          </div>

          <div className="mt-6 space-y-3">
            {routeSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Live trips" subtitle="Draft, dispatched, completed, and cancelled trips shown in a single board.">
        <Table
          columns={["Trip", "Route", "Vehicle", "Driver", "Weight", "Distance", "Status"]}
          rows={visibleTrips.map((trip) => [
            trip.id,
            trip.route,
            trip.vehicle,
            trip.driver,
            trip.weight,
            trip.distance,
            <Pill key={`${trip.id}-trip`} tone={trip.tone}>{trip.status}</Pill>
          ])}
          getRowClassName={() => (searchTerm ? "bg-[color:rgba(255,255,255,0.02)]" : "")}
        />
      </Panel>
    </AppShell>
  );
}