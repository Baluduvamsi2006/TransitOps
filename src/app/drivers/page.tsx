import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, Pill, StatGrid, Table } from "../../components/transit-ui";
import { driverRows } from "../../lib/transitops-data";

const driverSummary = [
  { label: "Available Drivers", value: "9", tone: "success" as const },
  { label: "On Trip", value: "4", tone: "info" as const },
  { label: "Off Duty", value: "3", tone: "neutral" as const },
  { label: "Suspended", value: "1", tone: "danger" as const }
];

export default function DriversPage() {
  return (
    <AppShell activePath="/drivers">
      <PageHeader
        eyebrow="Driver Management"
        title="Profiles, compliance, and safety scores"
        description="A compliance-first driver workspace for license tracking, safety monitoring, availability, and onboarding."
      />

      <StatGrid>
        {driverSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.95fr]">
        <Panel title="Driver roster" subtitle="Filter by name or license and review compliance signals at a glance.">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">Search name / license</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">License expiry: 30 days</div>
          </div>

          <Table
            columns={["Driver", "License", "Category", "Expiry", "Safety", "Status"]}
            rows={driverRows.map((driver) => [
              driver.name,
              driver.license,
              driver.category,
              driver.expiry,
              `${driver.safety}%`,
              <Pill key={`${driver.license}-driver`} tone={driver.tone}>{driver.status}</Pill>
            ])}
          />
        </Panel>

        <Panel title="Compliance notes" subtitle="The next DB-backed version will enforce these constraints at assignment time.">
          <div className="space-y-4 text-sm leading-7 text-[var(--muted-2)]">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              Drivers with expired licenses or suspended status stay out of dispatch selection.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              Safety scores are shown inline with status so fleet and safety teams can spot risk quickly.
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              A future reminder workflow can flag expiring licenses, SMS alerts, and escalation tasks.
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}