import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { SubmitButton } from "../../components/submit-button";
import { prisma } from "../../lib/prisma";
import { createFuelLog, deleteFuelLog, createExpense, deleteExpense } from "./actions";
import { FinanceFilters } from "./finance-filters";
import { DatePickerField } from "../../components/date-picker-field";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type FinancePageProps = {
  searchParams?: Promise<{
    search?: string;
    vehicleId?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function FinancePage(props: FinancePageProps) {
  const params = (await props.searchParams) ?? {};
  const searchTerm = (params.search ?? "").trim().toLowerCase();
  const filterVehicleId = params.vehicleId ?? "All";
  const message = params.message;
  const error = params.error;

  // Fetch all vehicles for dropdown selection and filtering
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { nameModel: "asc" }
  });

  // Fetch fuel logs
  const fuelLogs = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: "desc" }
  });

  // Fetch expenses
  const expenses = await prisma.expense.findMany({
    include: { vehicle: true },
    orderBy: { date: "desc" }
  });

  // Fetch maintenance logs to calculate maintenance spend
  const maintenanceLogs = await prisma.maintenanceLog.findMany();

  // Apply filters
  let filteredFuel = fuelLogs;
  if (filterVehicleId !== "All") {
    filteredFuel = filteredFuel.filter((f) => f.vehicleId === filterVehicleId);
  }
  if (searchTerm) {
    filteredFuel = filteredFuel.filter(
      (f) =>
        f.vehicle.nameModel.toLowerCase().includes(searchTerm) ||
        f.vehicle.registrationNumber.toLowerCase().includes(searchTerm)
    );
  }

  let filteredExpenses = expenses;
  if (filterVehicleId !== "All") {
    filteredExpenses = filteredExpenses.filter((e) => e.vehicleId === filterVehicleId);
  }
  if (searchTerm) {
    filteredExpenses = filteredExpenses.filter(
      (e) =>
        e.description.toLowerCase().includes(searchTerm) ||
        e.vehicle.nameModel.toLowerCase().includes(searchTerm) ||
        e.vehicle.registrationNumber.toLowerCase().includes(searchTerm)
    );
  }

  // Calculate live financial KPIs
  const totalFuelSpend = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalMaintSpend = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalOtherSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCost = totalFuelSpend + totalMaintSpend + totalOtherSpend;

  const financeKpis = [
    { label: "Fuel Spend", value: `₹${totalFuelSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tone: "accent" as const },
    { label: "Maintenance Spend", value: `₹${totalMaintSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tone: "warning" as const },
    { label: "Other Expenses", value: `₹${totalOtherSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tone: "info" as const },
    { label: "Total operational cost", value: `₹${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tone: "success" as const }
  ];

  // Calculate summary metrics
  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
  const averagePricePerLiter = totalLiters > 0 ? totalFuelSpend / totalLiters : 0;

  const financeSummary = [
    { label: "Total Fuel Logs", value: `${fuelLogs.length} entries` },
    { label: "Total Liters Filled", value: `${totalLiters.toFixed(1)} L` },
    { label: "Avg Price / Liter", value: `₹${averagePricePerLiter.toFixed(2)}` },
    { label: "Total Expense Entries", value: `${expenses.length} entries` }
  ];

  return (
    <AppShell activePath="/finance" user={null}>
      <PageHeader
        eyebrow="Financials"
        title="Fuel & Expenses"
      />

      <StatGrid>
        {financeKpis.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      {(message || error) && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? "border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] text-(--danger)" : "border-[rgba(92,191,118,0.35)] bg-[rgba(92,191,118,0.12)] text-(--success)"}`}>
          {error ?? message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] mb-6">
        <Panel title="Cost logging" subtitle="Log fuel replenishment or other operational expenses.">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-(--accent) mb-3">Refuel Asset</h3>
              <form action={createFuelLog} className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Vehicle</span>
                  <select
                    name="vehicleId"
                    required
                    style={{ colorScheme: "dark" }}
                    className="w-full rounded-2xl border border-white/8 bg-(--panel) px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameModel} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Liters</span>
                  <input
                    type="number"
                    name="liters"
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="45"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Cost (₹)</span>
                  <input
                    type="number"
                    name="cost"
                    required
                    min="1"
                    step="0.01"
                    placeholder="4200"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  />
                </label>

                <div className="md:col-span-2">
                  <DatePickerField
                    name="date"
                    label="Refuel date"
                    required
                  />
                </div>

                <div className="flex items-end md:col-span-1">
                  <SubmitButton
                    label="Log Fuel"
                    className="w-full rounded-2xl bg-(--accent) py-2.5 text-sm font-semibold text-(--accent-ink) hover:brightness-110 transition"
                  />
                </div>
              </form>
            </div>

            <div className="border-t border-white/8 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-(--info) mb-3">Log Other Expense</h3>
              <form action={createExpense} className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Vehicle</span>
                  <select
                    name="vehicleId"
                    required
                    style={{ colorScheme: "dark" }}
                    className="w-full rounded-2xl border border-white/8 bg-(--panel) px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameModel} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Description</span>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="Tolls / Parking / Permits"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-(--muted)">Amount (₹)</span>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    step="0.01"
                    placeholder="450"
                    className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
                  />
                </label>

                <div className="md:col-span-2">
                  <DatePickerField
                    name="date"
                    label="Expense date"
                    required
                  />
                </div>

                <div className="flex items-end md:col-span-1">
                  <SubmitButton
                    label="Log Expense"
                    className="w-full rounded-2xl bg-(--info) py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
                  />
                </div>
              </form>
            </div>
          </div>
        </Panel>

        <Panel title="Spend summary" subtitle="A quick cost breakdown for the finance team and fleet manager.">
          <div className="space-y-3">
            {financeSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm">
                <span className="text-(--muted)">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mb-6">
        <FinanceFilters vehicles={vehicles} />
      </div>

      <div className="grid gap-6">
        <Panel title="Fuel logs" subtitle="Per-vehicle fuel records used for efficiency calculations.">
          {filteredFuel.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2)">No fuel records match your search filters.</div>
          ) : (
            <Table
              columns={["Vehicle", "Date", "Liters", "Cost", "Actions"]}
              rows={filteredFuel.map((row) => [
                <div key={`${row.id}-vehicle`}>
                  <div className="font-semibold text-white">{row.vehicle.nameModel}</div>
                  <div className="text-xs text-(--muted)">{row.vehicle.registrationNumber}</div>
                </div>,
                formatDate(row.date),
                `${row.liters} L`,
                `₹${row.cost.toLocaleString()}`,
                <form key={`${row.id}-action`} action={deleteFuelLog}>
                  <input type="hidden" name="id" value={row.id} />
                  <SubmitButton
                    label="Delete"
                    className="rounded-full border border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] px-3 py-1.5 text-xs font-semibold text-(--danger) transition hover:bg-[rgba(217,80,63,0.18)]"
                  />
                </form>
              ])}
            />
          )}
        </Panel>

        <Panel title="Other expenses" subtitle="Tolls and other trip-linked expenses tracked separately from fuel.">
          {filteredExpenses.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-(--muted-2)">No expense records match your search filters.</div>
          ) : (
            <Table
              columns={["Vehicle", "Description", "Amount", "Date", "Actions"]}
              rows={filteredExpenses.map((row) => [
                <div key={`${row.id}-vehicle`}>
                  <div className="font-semibold text-white">{row.vehicle.nameModel}</div>
                  <div className="text-xs text-(--muted)">{row.vehicle.registrationNumber}</div>
                </div>,
                row.description,
                `₹${row.amount.toLocaleString()}`,
                formatDate(row.date),
                <form key={`${row.id}-action`} action={deleteExpense}>
                  <input type="hidden" name="id" value={row.id} />
                  <SubmitButton
                    label="Delete"
                    className="rounded-full border border-[rgba(217,80,63,0.35)] bg-[rgba(217,80,63,0.12)] px-3 py-1.5 text-xs font-semibold text-(--danger) transition hover:bg-[rgba(217,80,63,0.18)]"
                  />
                </form>
              ])}
            />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}