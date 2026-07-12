"use client";

import { useTransition } from "react";
import { updateVehicleStatus } from "./actions";
import { Pill } from "../../components/transit-ui";

function getStatusTone(status: string) {
  switch (status) {
    case "AVAILABLE": return "success";
    case "ON_TRIP": return "info";
    case "IN_SHOP": return "warning";
    case "RETIRED": return "danger";
    default: return "muted";
  }
}

export function StatusUpdater({ vehicleId, initialStatus }: { vehicleId: string; initialStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateVehicleStatus(vehicleId, newStatus);
    });
  };

  return (
    <div className="relative inline-block">
      <select
        value={initialStatus}
        onChange={handleChange}
        disabled={isPending}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      >
        <option value="AVAILABLE">Available</option>
        <option value="ON_TRIP">On Trip</option>
        <option value="IN_SHOP">In Shop</option>
        <option value="RETIRED">Retired</option>
      </select>
      <Pill tone={getStatusTone(initialStatus) as any}>
        {isPending ? "Updating..." : initialStatus.replace("_", " ")}
      </Pill>
    </div>
  );
}
