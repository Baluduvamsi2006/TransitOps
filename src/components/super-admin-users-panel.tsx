"use client";

import { useEffect, useState, useTransition } from "react";
import type { Role } from "@prisma/client";

import { useSession } from "./session-provider";
import { roleLabels } from "../lib/rbac";

type UserRecord = {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
    lastLoginAt: string | null;
    lockedUntil: string | null;
};

const roleOptions = ["FLEET_MANAGER", "DISPATCHER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;

export function SuperAdminUsersPanel() {
    const session = useSession();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, startLoading] = useTransition();
    const [isSaving, startSaving] = useTransition();
    const [form, setForm] = useState<{
        name: string;
        email: string;
        password: string;
        role: (typeof roleOptions)[number];
    }>({ name: "", email: "", password: "", role: roleOptions[0] });

    const loadUsers = () => {
        startLoading(async () => {
            const response = await fetch("/api/admin/users");
            const payload = (await response.json()) as { users?: UserRecord[]; message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to load users.");
                return;
            }

            setUsers(payload.users ?? []);
            setError(null);
        });
    };

    useEffect(() => {
        if (session?.role === "SUPER_ADMIN") {
            loadUsers();
        }
    }, [session?.role]);

    if (session?.role !== "SUPER_ADMIN") {
        return null;
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);

        startSaving(async () => {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const payload = (await response.json()) as { message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to create user.");
                return;
            }

            setMessage("User created successfully.");
            setForm({ name: "", email: "", password: "", role: roleOptions[0] });
            loadUsers();
        });
    };

    const handleUnfreeze = (userId: string) => {
        setError(null);
        setMessage(null);
        startSaving(async () => {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "unfreeze" })
            });

            const payload = (await response.json()) as { message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to unfreeze user.");
                return;
            }

            setMessage("User unfrozen successfully.");
            loadUsers();
        });
    };

    return (
        <PanelBlock>
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[1.6rem] border border-white/8 bg-[var(--panel)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] lg:p-6">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-(--muted)">Super Admin</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-(--muted-2)">Create DB users directly from the website.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <label className="block space-y-2 text-sm text-white">
                            <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Name</span>
                            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-(--accent-2)" required />
                        </label>

                        <label className="block space-y-2 text-sm text-white">
                            <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Email</span>
                            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-(--accent-2)" required />
                        </label>

                        <label className="block space-y-2 text-sm text-white">
                            <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Password</span>
                            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-(--accent-2)" required />
                        </label>

                        <label className="block space-y-2 text-sm text-white">
                            <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Role</span>
                            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as (typeof roleOptions)[number] })} className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-(--accent-2)">
                                {roleOptions.map((role) => (
                                    <option key={role} value={role} className="bg-(--bg) text-white">{roleLabels[role as Role]}</option>
                                ))}
                            </select>
                        </label>

                        {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}
                        {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                        <button type="submit" disabled={isSaving} className="rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-(--accent-ink) transition hover:brightness-110 disabled:opacity-70">{isSaving ? "Creating user..." : "Create user"}</button>
                    </form>
                </section>

                <section className="rounded-[1.6rem] border border-white/8 bg-[var(--panel)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] lg:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-(--muted)">Existing users</h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-(--muted-2)">Current accounts in the database.</p>
                        </div>
                        <button type="button" onClick={loadUsers} disabled={isLoading} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-white disabled:opacity-70">{isLoading ? "Loading..." : "Refresh"}</button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/2">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/8 bg-white/4 text-[11px] uppercase tracking-[0.22em] text-(--muted)">
                                        <th className="px-4 py-3 font-semibold">Name</th>
                                        <th className="px-4 py-3 font-semibold">Email</th>
                                        <th className="px-4 py-3 font-semibold">Role</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => {
                                        const isFrozen = user.lockedUntil && new Date(user.lockedUntil) > new Date();
                                        return (
                                            <tr key={user.id} className="border-b border-white/6 last:border-b-0">
                                                <td className="px-4 py-3 text-white">{user.name}</td>
                                                <td className="px-4 py-3 text-(--muted-2)">{user.email}</td>
                                                <td className="px-4 py-3 text-(--muted-2)">{roleLabels[user.role]}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isFrozen
                                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        }`}>
                                                        {isFrozen ? "Frozen" : "Active"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {isFrozen && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnfreeze(user.id)}
                                                            className="rounded-xl border border-white/8 bg-white/6 px-3 py-1 text-xs text-white hover:bg-(--accent-soft) hover:text-(--accent) transition"
                                                        >
                                                            Unfreeze
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </PanelBlock>
    );
}

function PanelBlock({ children }: { children: React.ReactNode }) {
    return <div className="mt-5">{children}</div>;
}