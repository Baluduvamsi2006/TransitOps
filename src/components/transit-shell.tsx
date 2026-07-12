"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "../lib/transitops-data";

type AppShellProps = {
  children: React.ReactNode;
  activePath?: string;
};

export function AppShell({ children, activePath }: AppShellProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/6 bg-[var(--sidebar)] px-4 py-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-base font-black text-[var(--accent-ink)] shadow-[0_12px_30px_rgba(224,138,46,0.25)]">
              T
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">TransitOps</div>
              <div className="text-xs text-[var(--muted)]">Reference UI mode</div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href as never}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_10px_30px_rgba(224,138,46,0.12)]"
                      : "text-[var(--muted)] hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/6 text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/8 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Demo mode</p>
            <p className="mt-2 text-sm leading-6 text-white/88">
              Role-based login is intentionally disabled for now. These pages are wired for UI review only.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/6 bg-[color-mix(in_srbg,var(--bg)_86%,white_14%)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                <span className="text-sm text-[var(--muted)]">⌕</span>
                <input
                  aria-label="Search"
                  placeholder="Search vehicles, drivers, trips..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--muted)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-[var(--muted)]">
                  Transport Operations Demo
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)] text-sm font-bold text-[var(--accent-ink)]">
                  U
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}