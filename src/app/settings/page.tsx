import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppShell } from "../../components/transit-shell";
import { MetricCard, PageHeader, Panel, StatGrid, Table } from "../../components/transit-ui";
import { SuperAdminUsersPanel } from "../../components/super-admin-users-panel";
import { rbacRows, settingsRows } from "../../lib/transitops-data";
import { SESSION_COOKIE_NAME, readSessionToken, toSessionInfo } from "../../lib/jwt";

export const metadata: Metadata = {
  title: "TransitOps | Settings",
  description: "Settings and RBAC management"
};

const settingsSummary = [
  { label: "Roles Listed", value: "5", tone: "accent" as const },
  { label: "Screens Covered", value: "7", tone: "success" as const },
  { label: "Policy Rules", value: "15", tone: "info" as const },
  { label: "Future DB Hooks", value: "Ready", tone: "warning" as const }
];

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionToken = await readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const session = sessionToken ? toSessionInfo(sessionToken) : null;
  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  return (
    <AppShell activePath="/settings">
      <PageHeader
        eyebrow="Settings"
        title="RBAC overview and access controls"
        description={
          isSuperAdmin
            ? "Full administrative view. Manage users, access policies and role assignments."
            : `Your current role is ${session?.role?.replace(/_/g, " ")}. You have read-only access to the settings and policy overview.`
        }
      />

      <StatGrid>
        {settingsSummary.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </StatGrid>

      {/* Profile card - visible to all users */}
      <Panel title="Your profile" subtitle="Your account details and current role assignment.">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Name</p>
            <p className="mt-2 text-sm text-white">{session?.name ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Email</p>
            <p className="mt-2 text-sm text-white">{session?.email ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Role</p>
            <p className="mt-2 text-sm font-semibold text-(--accent)">{session?.role?.replace(/_/g, " ") ?? "—"}</p>
          </div>
        </div>
      </Panel>

      {/* RBAC policy info - visible to all */}
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Access policy" subtitle="The matrix below mirrors the current login-driven role split used by the app shell and route guards.">
          <div className="space-y-4 text-sm leading-7 text-(--muted-2)">
            {isSuperAdmin && (
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Super Admin has full access and is the top-level account for user and role management.</div>
            )}
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Fleet Manager sees the operational surface across fleet, drivers, trips, maintenance, finance, and reports.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Dispatcher focuses on the dashboard and trips.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Safety Officer watches driver compliance, license expiry, and safety scores.</div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Financial Analyst reviews fuel, expenses, and reporting.</div>
          </div>
        </Panel>

        <Panel title="System settings" subtitle="Platform-wide settings and authentication information.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Theme</p>
              <p className="mt-2 text-sm text-white">Dark mode enabled by default</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Authentication</p>
              <p className="mt-2 text-sm text-white">JWT login drives navigation and route protection</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Account security</p>
              <p className="mt-2 text-sm text-white">Account frozen after 5 consecutive failed login attempts</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-(--muted)">Password reset</p>
              <p className="mt-2 text-sm text-white">Email verification code sent to registered address</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Full role matrix - Super Admin only */}
      {isSuperAdmin && (
        <>
          <Panel title="Role matrix" subtitle="Reference table showing the enforced access split used by the login flow.">
            <Table
              columns={["Role", "Dashboard", "Fleet", "Drivers", "Trips", "Maintenance", "Fuel", "Reports"]}
              rows={rbacRows.map((row) => row as unknown as React.ReactNode[])}
            />
          </Panel>

          <Panel title="Screen map" subtitle="The current frontend pages are listed here as the visible product surface.">
            <Table
              columns={["Page", "Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}
              rows={settingsRows.map((row) => row.map((value) => value as React.ReactNode))}
            />
          </Panel>
        </>
      )}

      {/* Super Admin User Management */}
      <SuperAdminUsersPanel />
    </AppShell>
  );
}