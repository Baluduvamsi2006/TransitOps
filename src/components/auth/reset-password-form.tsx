"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email") || "";
    const codeParam = searchParams.get("code") || "";

    const [email, setEmail] = useState(emailParam);
    const [code, setCode] = useState(codeParam);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const passwordsMatch = password === confirmPassword;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);

        if (!email || !code) {
            setError("Email and verification code are required.");
            return;
        }

        if (!passwordsMatch) {
            setError("Passwords do not match.");
            return;
        }

        startTransition(async () => {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, password })
            });

            const payload = (await response.json()) as { message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to reset the password.");
                return;
            }

            setMessage(payload.message ?? "Password updated. Redirecting to sign in...");
            router.replace("/login" as any);
            router.refresh();
        });
    };

    return (
        <div className="rounded-4xl border border-white/8 bg-(--panel) p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--accent)">Reset password</p>
                <h2 className="text-2xl font-semibold text-white">Choose a new password</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Use the verification code from your email to set a fresh password.</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {email ? (
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white">
                        Enter the verification code sent to your registered email <strong className="text-(--accent)">{email}</strong>
                    </div>
                ) : null}

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Verification code</span>
                    <input
                        type="text"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        required
                        autoComplete="one-time-code"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-(--accent-2) focus:bg-white/8"
                        placeholder="123456"
                    />
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">New password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-(--accent-2) focus:bg-white/8"
                        placeholder="••••••••"
                    />
                </label>

                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">Confirm password</span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-(--accent-2) focus:bg-white/8"
                        placeholder="••••••••"
                    />
                </label>

                {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}
                {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-(--accent-ink) transition hover:brightness-110 disabled:opacity-70"
                >
                    {isPending ? "Updating password..." : "Update password"}
                </button>
            </form>
        </div>
    );
}