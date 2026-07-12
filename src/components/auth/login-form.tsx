"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { roleLabels } from "../../lib/rbac";

const loginRoles = ["SUPER_ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;

export function LoginForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<(typeof loginRoles)[number]>(loginRoles[1] ?? loginRoles[0]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    role
                })
            });

            const payload = (await response.json()) as {
                message?: string;
                redirectTo?: string;
            };

            if (!response.ok) {
                setError(payload.message ?? "Login failed. Check your credentials and role.");
                return;
            }

            router.replace(payload.redirectTo ?? "/");
            router.refresh();
        });
    };

    return (
        <div className="rounded-[2rem] border border-white/8 bg-[var(--panel)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Sign in</p>
                <h2 className="text-2xl font-semibold text-white">Access your role</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Pick the DB-assigned role, then sign in with email and password.</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-[var(--accent-2)] focus:bg-white/8"
                        placeholder="raven.k@transitops.in"
                    />
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-[var(--accent-2)] focus:bg-white/8"
                        placeholder="••••••••"
                    />
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Role</span>
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value as (typeof loginRoles)[number])}
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent-2)] focus:bg-white/8"
                    >
                        {loginRoles.map((item) => (
                            <option key={item} value={item} className="bg-[var(--bg)] text-white">
                                {roleLabels[item]}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex items-center justify-between gap-4 text-sm text-(--muted)">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/6 accent-[var(--accent)]" />
                        Remember me
                    </label>
                    <Link href="/forgot-password" className="text-[var(--info)] transition hover:text-white">
                        Forgot password?
                    </Link>
                </div>

                {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 disabled:opacity-70"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </div>
    );
}