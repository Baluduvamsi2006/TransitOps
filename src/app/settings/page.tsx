import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, StatGrid, Table } from "../../components/transit-ui";
import { rbacRows, settingsRows } from "../../lib/transitops-data";

const settingsSummary = [
  { label: "Roles Listed", value: "4", tone: "accent" as const },
  { label: "Screens Covered", value: "7", tone: "success" as const },
  { label: "Policy Rules", value: "13", tone: "info" as const },
  { label: "Future DB Hooks", value: "Ready", tone: "warning" as const }
];

export default function SettingsPage() {
  return (
    <AppShell activePath="/settings">
      <PageHeader
        eyebrow="Settings"
        title="RBAC overview and demo controls"
        description="A UI-only placeholder for login-driven access control that will later be replaced by real authentication state."
      />

      <StatGrid>
        {settingsSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Access policy" subtitle="This screen shows the intended permission matrix while authentication is still mocked.">
          <div className="space-y-4 text-sm leading-7 text-[var(--muted-2)]">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Fleet Manager sees everything and handles assets, maintenance, and finance coordination.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Dispatcher focuses on trips and the active dispatch board.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Safety Officer watches driver compliance, license expiry, and safety scores.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Financial Analyst reviews fuel, maintenance, and operational cost reporting.</div>
          </div>
        </Panel>

        <Panel title="Demo controls" subtitle="Until auth is connected, these controls remain visual-only.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Theme</p>
              <p className="mt-2 text-sm text-white">Dark mode enabled by default</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Authentication</p>
              <p className="mt-2 text-sm text-white">Login will replace demo navigation later</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Role matrix" subtitle="Reference table showing the intended screen access split before backend enforcement exists.">
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