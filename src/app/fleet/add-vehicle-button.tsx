"use client";

import { useState } from "react";
import { AddVehicleModal } from "./add-vehicle-modal";

export function AddVehicleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:bg-[#ff9533]"
      >
        + Add Vehicle
      </button>
      <AddVehicleModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
