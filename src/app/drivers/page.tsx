import Link from "next/link";

import { AppShell } from "../../components/transit-shell";
import { DatePickerField } from "../../components/date-picker-field";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { prisma } from "../../lib/prisma";
import { currentTimestamp } from "../../lib/time";
import { createDriver, deleteDriver, updateDriver } from "./actions";
import { DriverFilters } from "./driver-filters";

type DriversPageProps = {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    status?: string;
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
  // Manage rights are enabled by default since authentication is handled externally
  const canManage = true;
  const params = (await searchParams) ?? {};
  const drivers = await prisma.driver.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });
  const nowTime = currentTimestamp();
  const searchTerm = (params.search ?? "").trim().toLowerCase();
  const filterStatus = params.status ?? "All";

  const selectedDriver = params.edit ? drivers.find((driver) => driver.id === params.edit) : undefined;

  let visibleDrivers = drivers;
  if (searchTerm) {
    visibleDrivers = visibleDrivers.filter((driver) => {
      const haystack = [driver.name, driver.licenseNumber, driver.licenseCategory, driver.contactNumber]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }
  if (filterStatus && filterStatus !== "All") {
    visibleDrivers = visibleDrivers.filter((driver) => driver.status === filterStatus);
  }

  const availableDrivers = drivers.filter((driver) => driver.status === "AVAILABLE").length;
  const onTripDrivers = drivers.filter((driver) => driver.status === "ON_TRIP").length;
  const offDutyDrivers = drivers.filter((driver) => driver.status === "OFF_DUTY").length;
  const suspendedDrivers = drivers.filter((driver) => driver.status === "SUSPENDED").length;
  const expiringSoonDrivers = drivers.filter((driver) => {
    const daysUntilExpiry = (driver.licenseExpiryDate.getTime() - nowTime) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30;
  }).length;
  const dispatchReadyDrivers = visibleDrivers.filter((driver) => canDispatch(driver, nowTime));
  const message = params.message;
  const error = params.error;
  const highlightedDriverId = params.edit;

  const driverSummary = [
    { label: "Available Drivers", value: availableDrivers, tone: "success" as const },
    { label: "On Trip", value: onTripDrivers, tone: "info" as const },
    { label: "Off Duty", value: offDutyDrivers, tone: "neutral" as const },
    { label: "Suspended", value: suspendedDrivers, tone: "danger" as const }
  ];

  return (
    <AppShell activePath="/drivers" user={null}>
      <PageHeader
        eyebrow="Driver Management"
        title="Driver records and compliance"
        description="Keep driver details, license status, and dispatch readiness in one clean workspace."
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
        {canManage ? (
          <Panel title={selectedDriver ? "Edit driver" : "Add driver"} subtitle="Keep driver records current and visible for dispatch decisions.">
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

              <DatePickerField
                name="licenseExpiryDate"
                label="License expiry"
                defaultValue={selectedDriver ? toInputDateValue(selectedDriver.licenseExpiryDate) : ""}
                required
              />

              <label className="space-y-2 md:col-span-1">
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Num</span>
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
                  className="w-full rounded-2xl border border-white/8 bg-[var(--panel)] px-4 py-3 text-sm text-white outline-none transition duration-300 focus:border-[var(--accent)]"
                >
                  <option className="bg-[var(--panel)] text-white" value="AVAILABLE">
                    Available
                  </option>
                  <option className="bg-[var(--panel)] text-white" value="ON_TRIP">
                    On Trip
                  </option>
                  <option className="bg-[var(--panel)] text-white" value="OFF_DUTY">
                    Off Duty
                  </option>
                  <option className="bg-[var(--panel)] text-white" value="SUSPENDED">
                    Suspended
                  </option>
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
        ) : (
          <Panel title="Driver records access" subtitle="View-only access for your current role.">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-5 text-sm text-[var(--muted-2)] leading-7">
              Only Safety Officers and Fleet Managers can create, update, or delete driver compliance records.
            </div>
          </Panel>
        )}

        <Panel title="Dispatch eligibility" subtitle="Only drivers who are available and valid can be selected for trips.">
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
              <div className="mt-2 text-sm text-[var(--muted-2)]">Suspended or On Trip drivers are blocked from assignment until their state changes back to Available.</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Driver roster" subtitle="Edit or delete records from the live driver table.">
        <DriverFilters />
        {visibleDrivers.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-[var(--muted-2)] mb-4">No drivers match your search filters.</div>
        ) : null}
        <Table
          columns={["Driver", "License", "Category", "Expiry", "Safety", "Status", "Actions"]}
          rows={visibleDrivers.map((driver) => [
            <Link key={`${driver.id}-name`} href={`/drivers?edit=${driver.id}&search=${encodeURIComponent(params.search ?? "")}&status=${encodeURIComponent(params.status ?? "")}`} className="font-medium text-white transition hover:text-[var(--accent)]">
              {driver.name}
            </Link>,
            driver.licenseNumber,
            driver.licenseCategory,
            <span key={`${driver.id}-expiry`} className={driver.licenseExpiryDate.getTime() < nowTime ? "text-[var(--danger)]" : "text-white"}>
              {formatDate(driver.licenseExpiryDate)}
            </span>,
            `${driver.safetyScore.toFixed(0)}%`,
            <Pill key={`${driver.id}-status`} tone={toStatusTone(driver.status)}>
              {driver.status.replace("_", " ")}
            </Pill>,
            canManage ? (
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
            ) : (
              <span key={`${driver.id}-actions`} className="text-xs text-[var(--muted)] italic">View only</span>
            )
          ])}
          getRowClassName={(rowIndex) => {
            const driver = visibleDrivers[rowIndex];

            if (!driver) {
              return "";
            }

            if (highlightedDriverId && driver.id === highlightedDriverId) {
              return "bg-[color:rgba(224,138,46,0.10)] ring-1 ring-[color:rgba(224,138,46,0.28)]";
            }

            if (searchTerm) {
              return "bg-[color:rgba(255,255,255,0.02)]";
            }

            return "";
          }}
        />
      </Panel>
    </AppShell>
  );
}
