"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { roleLabels } from "../../lib/rbac";

const loginRoles = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;

const DEMO_EMAIL = "superadmin@transitops.in";
const DEMO_PASSWORD = "SuperAdmin@12345";

function CopyButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const el = document.createElement("textarea");
            el.value = value;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={`Copy ${label}`}
            className="ml-2 flex-shrink-0 rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-xs text-(--muted) transition hover:border-white/25 hover:bg-white/12 hover:text-white active:scale-95"
        >
            {copied ? (
                <span className="flex items-center gap-1">
                    {/* check icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-green-400">Copied</span>
                </span>
            ) : (
                <span className="flex items-center gap-1">
                    {/* copy icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy
                </span>
            )}
        </button>
    );
}

export function LoginForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<(typeof loginRoles)[number]>(loginRoles[1] ?? loginRoles[0]);

    const fillDemo = () => {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
    };

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

            let payload: { message?: string; redirectTo?: string } = {};
            try {
                payload = await response.json();
            } catch (e) {
                console.error("Failed to parse login response:", e);
            }

            if (!response.ok) {
                setError(payload.message ?? "Login failed. Check your credentials and role.");
                return;
            }

            router.replace((payload.redirectTo ?? "/") as never);
            router.refresh();
        });
    };

    return (
        <div className="rounded-4xl border border-white/8 bg-(--panel) p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--accent)">Sign in</p>
                <h2 className="text-2xl font-semibold text-white">Access your role</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Pick the DB-assigned role, then sign in with email and password.</p>
            </div>

            {/* ── Demo credentials panel ── */}
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                    {/* star / judge icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Hackathon Demo Credentials</p>
                </div>

                {/* email row */}
                <div className="mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400/70">Email</span>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <code className="select-all text-xs text-white">{DEMO_EMAIL}</code>
                        <CopyButton value={DEMO_EMAIL} label="email" />
                    </div>
                </div>

                {/* password row */}
                <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400/70">Password</span>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                        <code className="select-all text-xs text-white">{DEMO_PASSWORD}</code>
                        <CopyButton value={DEMO_PASSWORD} label="password" />
                    </div>
                </div>

                {/* note */}
                <p className="text-[11px] leading-5 text-amber-300/80">
                    <span className="font-bold text-amber-300">* Super Admin</span> — can log in with{" "}
                    <span className="font-semibold text-white">any of the 4 roles</span>:{" "}
                    Fleet Manager, Dispatcher, Safety Officer, Financial Analyst.
                </p>

                {/* quick-fill button */}
                <button
                    type="button"
                    onClick={fillDemo}
                    className="mt-3 w-full rounded-xl border border-amber-500/40 bg-amber-500/12 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 hover:text-amber-200 active:scale-95"
                >
                    ↙ Fill credentials automatically
                </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-(--accent-2) focus:bg-white/8"
                        placeholder="raven.k@transitops.in"
                    />
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Password</span>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                            className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 pl-4 pr-12 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-(--accent-2) focus:bg-white/8"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-(--muted) hover:text-white transition"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                            )}
                        </button>
                    </div>
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Role</span>
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value as (typeof loginRoles)[number])}
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-(--accent-2) focus:bg-white/8"
                    >
                        {loginRoles.map((item) => (
                            <option key={item} value={item} className="bg-(--bg) text-white">
                                {(roleLabels as Record<string, string>)[item]}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex items-center justify-between gap-4 text-sm text-(--muted)">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/6 accent-(--accent)" />
                        Remember me
                    </label>
                    <Link href="/forgot-password" className="text-(--info) transition hover:text-white">
                        Forgot password?
                    </Link>
                </div>

                {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-(--accent-ink) transition hover:brightness-110 disabled:opacity-70"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </div>
    );
}