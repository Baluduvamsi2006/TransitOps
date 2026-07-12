type AuthFrameProps = {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    children: React.ReactNode;
};

export function AuthFrame({ eyebrow, title, description, bullets, children }: AuthFrameProps) {
    return (
        <div className="min-h-screen bg-(--bg) text-(--text) lg:grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative overflow-hidden border-b border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(224,138,46,0.2),transparent_30%),linear-gradient(180deg,#1b1712_0%,#13110d_100%)] px-6 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-(--accent) to-transparent opacity-70" />
                <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(224,138,46,0.18),transparent_68%)] blur-2xl" />
                <div className="relative flex h-full max-w-xl flex-col justify-between gap-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-(--muted)">
                            <span className="h-2 w-2 rounded-full bg-(--accent)" />
                            TransitOps RBAC
                        </div>

                        <div className="space-y-4">
                            <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h1>
                            <p className="max-w-xl text-base leading-7 text-(--muted-2)">{description}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {bullets.map((bullet) => (
                                <div key={bullet} className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm leading-6 text-white/90">
                                    {bullet}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-(--muted)">
                        <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">{eyebrow}</p>
                        <p>JWT sessions, role-specific routing, and email reset flows are wired for the current DB-backed app.</p>
                    </div>
                </div>
            </section>

            <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="w-full max-w-xl">{children}</div>
            </section>
        </div>
    );
}