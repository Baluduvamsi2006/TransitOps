"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export function VehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, router, searchParams]);

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search reg / model..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-(--accent)"
      />

      <select
        value={searchParams.get("type") || "All"}
        onChange={(e) => updateFilter("type", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent)"
      >
        <option value="All">Type: All</option>
        <option value="Van">Van</option>
        <option value="Mini Truck">Mini Truck</option>
        <option value="Truck">Truck</option>
        <option value="Heavy Duty">Heavy Duty</option>
      </select>

      <select
        value={searchParams.get("status") || "All"}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent)"
      >
        <option value="All">Status: All</option>
        <option value="AVAILABLE">Available</option>
        <option value="ON_TRIP">On Trip</option>
        <option value="IN_SHOP">In Shop</option>
        <option value="RETIRED">Retired</option>
      </select>
    </div>
  );
}
