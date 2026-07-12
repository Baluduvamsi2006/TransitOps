"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";

export function VehicleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Debounced search using transitions to keep focus and prevent hard reload
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = params.get("search") || "";
      if (searchQuery === currentSearch) return;

      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}` as any);
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, router, searchParams, pathname]);

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}` as any);
      });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="mb-4 flex flex-wrap gap-3 items-center">
      <div className="relative">
        <input
          type="text"
          placeholder="Search reg / model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-(--accent) transition"
        />
        {isPending && (
          <span className="absolute right-3 top-2.5 text-xs text-(--muted) animate-pulse">
            ...
          </span>
        )}
      </div>

      <select
        value={searchParams.get("type") || "All"}
        onChange={(e) => updateFilter("type", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
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
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
      >
        <option value="All">Status: All</option>
        <option value="AVAILABLE">Available</option>
        <option value="ON_TRIP">On Trip</option>
        <option value="IN_SHOP">In Shop</option>
        <option value="RETIRED">Retired</option>
      </select>

      <select
        value={searchParams.get("sort") || "newest"}
        onChange={(e) => updateFilter("sort", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
      >
        <option value="newest">Sort: Newest First</option>
        <option value="capacity-desc">Capacity: High to Low</option>
        <option value="odometer-desc">Odometer: High to Low</option>
        <option value="cost-desc">Cost: High to Low</option>
      </select>
    </div>
  );
}
