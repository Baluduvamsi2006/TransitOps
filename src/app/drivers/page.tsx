import Link from "next/link";

import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { currentTimestamp } from "../../lib/time";
import { createDriver, deleteDriver, updateDriver } from "./actions";

type DriversPageProps = {
  searchParams?: Promise<{
    edit?: string;
    error?: string;
    message?: string;
  }>;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toInputDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toStatusTone(status: string) {
  return {
    AVAILABLE: "success",
    ON_TRIP: "info",
    OFF_DUTY: "muted",
    SUSPENDED: "danger"
  }[status] as "success" | "info" | "muted" | "danger";
}

function canDispatch(driver: { licenseExpiryDate: Date; status: string }, nowTime: number) {
  return driver.status === "AVAILABLE" && driver.licenseExpiryDate.getTime() > nowTime;
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const params = (await searchParams) ?? {};
  const drivers = await prisma.driver.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });
  const nowTime = currentTimestamp();

  const selectedDriver = params.edit ? drivers.find((driver) => driver.id === params.edit) : undefined;
  const availableDrivers = drivers.filter((driver) => driver.status === "AVAILABLE").length;
  const onTripDrivers = drivers.filter((driver) => driver.status === "ON_TRIP").length;
  const offDutyDrivers = drivers.filter((driver) => driver.status === "OFF_DUTY").length;
  const suspendedDrivers = drivers.filter((driver) => driver.status === "SUSPENDED").length;
  const expiringSoonDrivers = drivers.filter((driver) => {
    const daysUntilExpiry = (driver.licenseExpiryDate.getTime() - nowTime) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30;
  }).length;
  const dispatchReadyDrivers = drivers.filter((driver) => canDispatch(driver, nowTime));
  const message = params.message;
  const error = params.error;

  const driverSummary = [
    { label: "Available Drivers", value: availableDrivers, tone: "success" as const },
    { label: "On Trip", value: onTripDrivers, tone: "info" as const },
    { label: "Off Duty", value: offDutyDrivers, tone: "neutral" as const },
    { label: "Suspended", value: suspendedDrivers, tone: "danger" as const }
  ];

  return (
    <AppShell activePath="/drivers">
      <PageHeader
        eyebrow="Driver Management"
        title="Profiles, compliance, and safety scores"
        description="A database-backed driver workspace for onboarding, license tracking, safety monitoring, and dispatch eligibility."
      />

      <StatGrid>
        {driverSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      {(message || error) && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? "border-[color:rgba(217,80,63,0.35)] bg-[color:rgba(217,80,63,0.12)] text-[var(--danger)]" : "border-[color:rgba(92,191,118,0.35)] bg-[color:rgba(92,191,118,0.12)] text-[var(--success)]"}`}>
          {error ?? message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title={selectedDriver ? "Edit driver" : "Register driver"} subtitle="Create or update a driver profile with validation against unique license numbers and dispatch eligibility rules.">
          <form action={selectedDriver ? updateDriver : createDriver} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="returnTo" value={selectedDriver ? `/drivers?edit=${selectedDriver.id}` : "/drivers"} />
            {selectedDriver ? <input type="hidden" name="id" value={selectedDriver.id} /> : null}

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Name</span>
              <input
                name="name"
                defaultValue={selectedDriver?.name ?? ""}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
                placeholder="Alex Verma"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">License number</span>
              <input
                name="licenseNumber"
                defaultValue={selectedDriver?.licenseNumber ?? ""}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
                placeholder="DL-99135"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">License category</span>
              <input
                name="licenseCategory"
                defaultValue={selectedDriver?.licenseCategory ?? ""}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
                placeholder="LMV"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">License expiry</span>
              <input
                type="date"
                name="licenseExpiryDate"
                defaultValue={selectedDriver ? toInputDateValue(selectedDriver.licenseExpiryDate) : ""}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Contact number</span>
              <input
                name="contactNumber"
                defaultValue={selectedDriver?.contactNumber ?? ""}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
                placeholder="9876543210"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Safety score</span>
              <input
                type="number"
                name="safetyScore"
                min="0"
                max="100"
                step="1"
                defaultValue={selectedDriver?.safetyScore ?? 100}
                required
                className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
              />
            </label>

            <label className="space-y-2 md:col-span-1">
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Status</span>
              <select
                name="status"
                defaultValue={selectedDriver?.status ?? "AVAILABLE"}
                style={{ colorScheme: "dark" }}
                className="w-full rounded-2xl border border-white/8 bg-[var(--panel)] px-4 py-3 text-sm text-white outline-none"
              >
                <option className="bg-[var(--panel)] text-white" value="AVAILABLE">Available</option>
                <option className="bg-[var(--panel)] text-white" value="ON_TRIP">On Trip</option>
                <option className="bg-[var(--panel)] text-white" value="OFF_DUTY">Off Duty</option>
                <option className="bg-[var(--panel)] text-white" value="SUSPENDED">Suspended</option>
              </select>
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110"
              >
                {selectedDriver ? "Update driver" : "Create driver"}
              </button>
              {selectedDriver ? (
                <Link
                  href="/drivers"
                  className="rounded-2xl border border-white/8 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel edit
                </Link>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel title="Dispatch eligibility" subtitle="Drivers must be available and have a valid license date before they can be selected for trips.">
          <div className="space-y-4 text-sm leading-7 text-[var(--muted-2)]">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="text-[var(--muted)]">Expiring within 30 days</div>
              <div className="mt-1 text-2xl font-semibold text-white">{expiringSoonDrivers}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="text-[var(--muted)]">Dispatch-ready pool</div>
              <div className="mt-1 text-2xl font-semibold text-white">{dispatchReadyDrivers.length}</div>
              <div className="mt-2 text-sm text-[var(--muted-2)]">Only available drivers with unexpired licenses are eligible for new trips.</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <div className="text-[var(--muted)]">Status rule</div>
              <div className="mt-2 text-sm text-[var(--muted-2)]">
                Suspended or On Trip drivers are blocked from assignment until their state changes back to Available.
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Driver roster" subtitle="Edit or delete records from the live driver table. License uniqueness is enforced at write time.">
        <Table
          columns={["Driver", "License", "Category", "Expiry", "Safety", "Status", "Actions"]}
          rows={drivers.map((driver) => [
            driver.name,
            driver.licenseNumber,
            driver.licenseCategory,
            <span key={`${driver.id}-expiry`} className={driver.licenseExpiryDate.getTime() < nowTime ? "text-[var(--danger)]" : "text-white"}>
              {formatDate(driver.licenseExpiryDate)}
            </span>,
            `${driver.safetyScore.toFixed(0)}%`,
            <Pill key={`${driver.id}-status`} tone={toStatusTone(driver.status)}>{driver.status.replace("_", " ")}</Pill>,
            <div key={`${driver.id}-actions`} className="flex justify-end gap-2">
              <Link
                href={`/drivers?edit=${driver.id}`}
                className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Edit
              </Link>
              <form action={deleteDriver}>
                <input type="hidden" name="id" value={driver.id} />
                <input type="hidden" name="returnTo" value="/drivers" />
                <button
                  type="submit"
                  className="rounded-full border border-[color:rgba(217,80,63,0.35)] bg-[color:rgba(217,80,63,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[color:rgba(217,80,63,0.18)]"
                >
                  Delete
                </button>
              </form>
            </div>
          ])}
        />
      </Panel>
    </AppShell>
  );
}