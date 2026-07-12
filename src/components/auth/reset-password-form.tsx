"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ResetPasswordFormProps = {
    token: string | null;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const tokenMissing = !token;
    const passwordsMatch = useMemo(() => password === confirmPassword, [confirmPassword, password]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);

        if (!token) {
            setError("The reset link is missing its token.");
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
                body: JSON.stringify({ token, password })
            });

            const payload = (await response.json()) as { message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to reset the password.");
                return;
            }

            setMessage(payload.message ?? "Password updated. Redirecting to sign in...");
            router.replace("/login");
            router.refresh();
        });
    };

    return (
        <div className="rounded-[2rem] border border-white/8 bg-[var(--panel)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Reset password</p>
                <h2 className="text-2xl font-semibold text-white">Choose a new password</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Use the one-time reset token from your email to set a fresh password.</p>
            </div>

            {tokenMissing ? (
                <p className="mt-6 rounded-2xl border border-[rgba(224,160,46,0.35)] bg-[rgba(224,160,46,0.12)] px-4 py-3 text-sm text-[#ffe1ad]">
                    The reset token is missing. Open the password reset link from your email again.
                </p>
            ) : null}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2 text-sm text-white">
                    <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">New password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-[var(--accent-2)] focus:bg-white/8"
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
                        className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-(--muted) focus:border-[var(--accent-2)] focus:bg-white/8"
                        placeholder="••••••••"
                    />
                </label>

                {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}
                {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isPending || tokenMissing}
                    className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 disabled:opacity-70"
                >
                    {isPending ? "Updating password..." : "Update password"}
                </button>
            </form>
        </div>
    );
}