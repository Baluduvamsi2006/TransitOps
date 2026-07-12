"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";

export function TripFilters() {
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
          placeholder="Search source / destination..."
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
        value={searchParams.get("status") || "All"}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
      >
        <option value="All">Status: All</option>
        <option value="DRAFT">Draft</option>
        <option value="DISPATCHED">Dispatched</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>
  );
}
