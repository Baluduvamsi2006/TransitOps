"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function DashboardFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "All") {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    return (
        <div className="mb-6 animate-fade-up">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Filters</h3>
            <div className="flex flex-wrap gap-4">
                <label className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--muted-2)]">Vehicle Type</span>
                    <select
                        className="rounded-2xl border border-white/8 bg-[var(--panel)] px-4 py-2 text-sm text-white outline-none focus:border-[var(--accent)] transition"
                        value={searchParams.get("type") || "All"}
                        onChange={(e) => router.push(`/?${createQueryString("type", e.target.value)}`)}
                        style={{ colorScheme: "dark" }}
                    >
                        <option value="All">All</option>
                        <option value="Van">Van</option>
                        <option value="Truck">Truck</option>
                        <option value="Mini Truck">Mini Truck</option>
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--muted-2)]">Status</span>
                    <select
                        className="rounded-2xl border border-white/8 bg-[var(--panel)] px-4 py-2 text-sm text-white outline-none focus:border-[var(--accent)] transition"
                        value={searchParams.get("status") || "All"}
                        onChange={(e) => router.push(`/?${createQueryString("status", e.target.value)}`)}
                        style={{ colorScheme: "dark" }}
                    >
                        <option value="All">All</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_TRIP">On Trip</option>
                        <option value="IN_SHOP">In Shop</option>
                        <option value="RETIRED">Retired</option>
                    </select>
                </label>

            </div>
        </div>
    );
}
