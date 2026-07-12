import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { SubmitButton } from "../../components/submit-button";
import { prisma } from "../../lib/prisma";
import { createMaintenanceLog, closeMaintenanceLog } from "./actions";

export default async function MaintenancePage() {
  const canManage = true; // Hardcoded default based on external RBAC handler

  const logs = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { createdAt: "desc" }
  });

  const availableVehicles = await prisma.vehicle.findMany({
    where: {
      status: { in: ["AVAILABLE", "IN_SHOP"] }
    },
    orderBy: { nameModel: "asc" }
  });

  const activeRecordsCount = logs.filter(l => l.isOpen).length;
  const closedRecordsCount = logs.filter(l => !l.isOpen).length;
  const inShopCount = await prisma.vehicle.count({ where: { status: "IN_SHOP" } });
  const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const avgCost = logs.length > 0 ? (totalCost / logs.length) : 0;

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const maintenanceSummary = [
    { label: "Active Records", value: activeRecordsCount, tone: "warning" as const },
    { label: "Closed Records", value: closedRecordsCount, tone: "success" as const },
    { label: "Vehicles In Shop", value: inShopCount, tone: "danger" as const },
    { label: "Average Ticket", value: formatCurrency(avgCost), tone: "accent" as const }
  ];

  return (
    <AppShell activePath="/maintenance">
      <PageHeader
        eyebrow="Maintenance"
        title="Service Logs"
      />

      <StatGrid>
        {maintenanceSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] mb-5">
        <Panel title="Log service record" subtitle="Creating an active maintenance log immediately removes the vehicle from dispatch selection.">
          {canManage ? (
            <form action={createMaintenanceLog} className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Vehicle</span>
                <input
                  list="available-vehicles"
                  name="vehicleExt"
                  required
                  placeholder="Search available or in-shop vehicles..."
                  autoComplete="off"
                  className="w-full rounded-2xl border border-white/8 bg-(--panel) px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                />
                <datalist id="available-vehicles">
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={`${v.nameModel} (${v.registrationNumber}) [${v.id}]`}>
                      {v.status.replace("_", " ")}
                    </option>
                  ))}
                </datalist>
              </label>

              <label className="block space-y-2 md:col-span-1">
                <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Service type</span>
                <input
                  name="description"
                  required
                  placeholder="e.g. Oil Change, Brake Repair"
                  className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                />
              </label>

              <label className="block space-y-2 md:col-span-1">
                <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Cost ($)</span>
                <input
                  type="number"
                  name="cost"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-(--accent) transition"
                />
              </label>

              <div className="md:col-span-2 pt-2">
                <SubmitButton
                  label="Save Log"
                  className="rounded-2xl bg-(--accent) px-5 py-3 text-sm font-semibold text-(--accent-ink) hover:brightness-110 transition"
                />
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/6 p-5 text-sm text-(--muted-2) leading-7">
              You have read-only access to the maintenance panel.
            </div>
          )}
        </Panel>

        <Panel title="Service notes" subtitle="These operational rules are strictly enforced by the backend database connection.">
          <div className="space-y-4 text-sm leading-7 text-(--muted-2)">
            <div className="rounded-2xl border border-[rgba(224,160,46,0.35)] bg-[rgba(224,160,46,0.12)] p-4 text-(--warning)">
              <strong className="block text-white mb-1">Dispatch Lock</strong>
              Logging a vehicle automatically sets its status to <Pill tone="warning">IN SHOP</Pill>, preventing dispatch.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              Closing an active record safely returns the asset status to <Pill tone="success">AVAILABLE</Pill>.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Service log" subtitle="Current and historical maintenance records shown together for quick oversight.">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2) mb-4">
            No maintenance records found.
          </div>
        ) : (
          <Table
            columns={["Vehicle", "Service", "Date", "Cost", "State", "Actions"]}
            rows={logs.map((record) => [
              <div key={`v-${record.id}`}>
                <div className="font-semibold text-white">{record.vehicle.nameModel}</div>
                <div className="text-xs text-(--muted)">{record.vehicle.registrationNumber}</div>
              </div>,
              record.description,
              new Date(record.date).toLocaleDateString(),
              formatCurrency(record.cost),
              <Pill key={`s-${record.id}`} tone={record.isOpen ? "warning" : "success"}>
                {record.isOpen ? "Active" : "Closed"}
              </Pill>,
              <div key={`a-${record.id}`} className="flex justify-end gap-2">
                {record.isOpen ? (
                  <form action={closeMaintenanceLog}>
                    <input type="hidden" name="id" value={record.id} />
                    <SubmitButton
                      label="Close Service"
                      className="rounded-full border border-[rgba(92,191,118,0.35)] bg-[rgba(92,191,118,0.12)] px-3 py-1.5 text-xs font-semibold text-(--success) hover:bg-[rgba(92,191,118,0.18)] transition"
                    />
                  </form>
                ) : (
                  <span className="text-xs text-(--muted) italic">Archived</span>
                )}
              </div>
            ])}
          />
        )}
      </Panel>
    </AppShell>
  );
}