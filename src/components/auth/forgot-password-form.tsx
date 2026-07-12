"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ForgotPasswordForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);

        startTransition(async () => {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const payload = (await response.json()) as { message?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to start password reset.");
                return;
            }

            setMessage(payload.message ?? "If the address exists, a verification code has been sent.");
            router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        });
    };


    return (
        <div className="rounded-[2rem] border border-white/8 bg-[var(--panel)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Reset email</p>
                <h2 className="text-2xl font-semibold text-white">Send a verification code</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Enter the email address tied to the DB account. We will mail a one-time verification code.</p>
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

                {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}
                {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 disabled:opacity-70"
                >
                    {isPending ? "Sending code..." : "Send code"}
                </button>
            </form>
        </div>
    );
}