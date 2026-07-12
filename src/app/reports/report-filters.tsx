"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

type ReportFiltersProps = {
  vehicles: Array<{ id: string; nameModel: string; registrationNumber: string }>;
  csvData: string;
};

export function ReportFilters({ vehicles, csvData }: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All" && value !== "") {
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

  function handleExport() {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={searchParams.get("vehicleId") || "All"}
          onChange={(e) => updateFilter("vehicleId", e.target.value)}
          className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
        >
          <option value="All">Vehicle: All</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nameModel} ({v.registrationNumber})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-(--muted) uppercase tracking-widest">From</label>
          <input
            type="date"
            defaultValue={searchParams.get("from") || ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            style={{ colorScheme: "dark" }}
            className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-(--muted) uppercase tracking-widest">To</label>
          <input
            type="date"
            defaultValue={searchParams.get("to") || ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            style={{ colorScheme: "dark" }}
            className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-2 text-sm text-(--muted) outline-none focus:border-(--accent) transition"
          />
        </div>

        {isPending && (
          <span className="text-xs text-(--muted) animate-pulse">Updating...</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 hover:border-(--accent) transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          Export PDF
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 hover:border-(--accent) transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
