"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { navItems } from "../lib/transitops-data";

type AppShellProps = {
  children: React.ReactNode;
  activePath?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
};

export function AppShell({ children, activePath, user }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchTimer = useRef<number | null>(null);
  const currentPath = activePath ?? pathname;
  const initialQuery = searchParams.get("q") ?? "";

  function updateSearch(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.replace((params.toString() ? `${pathname}?${params.toString()}` : pathname) as never);
    });
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.currentTarget.value.trim();

    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }

    searchTimer.current = window.setTimeout(() => {
      updateSearch(nextQuery);
    }, 180);
  }

  // Display mock user profile if session is not active
  const currentUser = user ?? {
    name: "Fleet Manager",
    email: "manager@transitops.com",
    role: "FLEET_MANAGER"
  };

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/6 bg-(--sidebar) px-4 py-5 lg:flex lg:flex-col">
          <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-(--accent) text-base font-black text-(--accent-ink) shadow-[0_12px_30px_rgba(224,138,46,0.25)]">
              T
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">TransitOps</div>
              <div className="text-xs text-(--muted)">Reference UI mode</div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href as never}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-300 ${
                    isActive
                      ? "bg-(--accent-soft) text-(--accent) shadow-[0_10px_30px_rgba(224,138,46,0.12)]"
                      : "text-(--muted) hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/6 text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/8 bg-white/6 p-4">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-[0.24em] text-(--accent)">
                {currentUser.role.replace("_", " ")}
              </p>
              <p className="mt-1 text-sm font-bold text-white leading-normal truncate">{currentUser.name}</p>
              <p className="text-xs font-mono text-(--muted) truncate">{currentUser.email}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/6 bg-[color-mix(in_srbg,var(--bg)_86%,white_14%)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm text-(--muted)">
                  Role: {currentUser.role.replace("_", " ")}
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-(--accent) text-sm font-bold text-(--accent-ink)">
                  {currentUser.name[0].toUpperCase()}
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