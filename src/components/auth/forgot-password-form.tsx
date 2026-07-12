"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ForgotPasswordForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [devCode, setDevCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        setDevCode(null);

        startTransition(async () => {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const payload = (await response.json()) as { message?: string; devCode?: string };

            if (!response.ok) {
                setError(payload.message ?? "Unable to start password reset.");
                return;
            }

            setMessage(payload.message ?? "If the address exists, a verification code has been sent.");

            if (payload.devCode) {
                // Dev mode: show the code on screen since no SMTP is configured
                setDevCode(payload.devCode);
            } else {
                // Production: redirect immediately
                router.push(`/reset-password?email=${encodeURIComponent(email)}` as any);
            }
        });
    };

    const handleContinue = () => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(devCode ?? "")}` as any);
    };

    return (
        <div className="rounded-4xl border border-white/8 bg-(--panel) p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--accent)">Reset email</p>
                <h2 className="text-2xl font-semibold text-white">Send a verification code</h2>
                <p className="text-sm leading-6 text-(--muted-2)">Enter the email address tied to the DB account. We will mail a one-time verification code.</p>
            </div>

            {!devCode ? (
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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

                    {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}
                    {error ? <p className="rounded-2xl border border-[rgba(216,90,76,0.35)] bg-[rgba(216,90,76,0.12)] px-4 py-3 text-sm text-[#ffb5ae]">{error}</p> : null}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-(--accent-ink) transition hover:brightness-110 disabled:opacity-70"
                    >
                        {isPending ? "Sending code..." : "Send code"}
                    </button>
                </form>
            ) : (
                <div className="mt-8 space-y-4">
                    {message ? <p className="rounded-2xl border border-[rgba(92,191,118,0.28)] bg-[rgba(92,191,118,0.12)] px-4 py-3 text-sm text-[#c9f2d4]">{message}</p> : null}

                    {/* Dev mode banner */}
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">⚡ Dev Mode — No SMTP configured</p>
                        <p className="text-sm text-yellow-200/80">Your verification code is shown below instead of being emailed.</p>
                        <p className="mt-2 text-center text-3xl font-bold tracking-[0.4em] text-yellow-300 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">{devCode}</p>
                    </div>

                    <button
                        onClick={handleContinue}
                        className="w-full rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-(--accent-ink) transition hover:brightness-110"
                    >
                        Continue to reset password →
                    </button>
                </div>
            )}
        </div>
    );
}