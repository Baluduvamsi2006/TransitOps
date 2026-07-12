import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, StatGrid, Table } from "../../components/transit-ui";
import { rbacRows, settingsRows } from "../../lib/transitops-data";

const settingsSummary = [
  { label: "Roles Listed", value: "5", tone: "accent" as const },
  { label: "Screens Covered", value: "7", tone: "success" as const },
  { label: "Policy Rules", value: "15", tone: "info" as const },
  { label: "Future DB Hooks", value: "Ready", tone: "warning" as const }
];

export default function SettingsPage() {
  return (
    <AppShell activePath="/settings">
      <PageHeader
        eyebrow="Settings"
        title="RBAC overview and access controls"
        description="This screen now reflects the role-aware login flow, with JWT sessions and a dedicated super admin boundary."
      />

      <StatGrid>
        {settingsSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Access policy" subtitle="The matrix below mirrors the current login-driven role split used by the app shell and route guards.">
          <div className="space-y-4 text-sm leading-7 text-(--muted-2)">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Super Admin has full access and is the top-level account for user and role management.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Fleet Manager sees the operational surface across fleet, drivers, trips, maintenance, finance, and reports.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Dispatcher focuses on the dashboard and trips.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Safety Officer watches driver compliance, license expiry, and safety scores.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Financial Analyst reviews fuel, expenses, and reporting.</div>
          </div>
        </Panel>

        <Panel title="Demo controls" subtitle="Auth is now connected; these controls remain informational while the DB-backed admin UI is added next.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Theme</p>
              <p className="mt-2 text-sm text-white">Dark mode enabled by default</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Authentication</p>
              <p className="mt-2 text-sm text-white">JWT login now drives navigation and route protection</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Role matrix" subtitle="Reference table showing the enforced access split used by the login flow.">
        <Table
          columns={["Role", "Dashboard", "Fleet", "Drivers", "Trips", "Maintenance", "Fuel", "Reports"]}
          rows={rbacRows.map((row) => row as unknown as React.ReactNode[])}
        />
      </Panel>

      <Panel title="Screen map" subtitle="The current frontend pages are listed here as the visible product surface.">
        <Table
          columns={["Page", "Purpose", "State"]}
          rows={settingsRows.map((row) => row.map((value) => value as React.ReactNode))}
        />
      </Panel>
    </AppShell>
  );
}