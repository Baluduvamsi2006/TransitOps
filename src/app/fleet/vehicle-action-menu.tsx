"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { editVehicleDetails, updateVehicleStatus } from "./actions";

export function VehicleActionMenu({ vehicle }: { vehicle: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateStatus = (status: string) => {
    startTransition(async () => {
      await updateVehicleStatus(vehicle.id, status);
      setIsOpen(false);
    });
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await editVehicleDetails(vehicle.id, formData);
      setIsEditModalOpen(false);
    });
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
        >
          <span className="text-white/60">•••</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-white/10 bg-[#1A1A1A] p-1 shadow-2xl">
            <button
              onClick={() => { setIsEditModalOpen(true); setIsOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            >
              Edit Details
            </button>
            
            <div className="my-1 border-t border-white/10" />
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-(--muted)">
              Change Status
            </div>
            
            <button
              onClick={() => handleUpdateStatus("AVAILABLE")}
              disabled={isPending}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${vehicle.status === "AVAILABLE" ? "bg-white/5 text-(--success)" : "text-white"}`}
            >
              Available
            </button>
            <button
              onClick={() => handleUpdateStatus("ON_TRIP")}
              disabled={isPending}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${vehicle.status === "ON_TRIP" ? "bg-white/5 text-(--info)" : "text-white"}`}
            >
              On Trip
            </button>
            <button
              onClick={() => handleUpdateStatus("IN_SHOP")}
              disabled={isPending}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${vehicle.status === "IN_SHOP" ? "bg-white/5 text-(--warning)" : "text-white"}`}
            >
              In Shop
            </button>
            <button
              onClick={() => handleUpdateStatus("RETIRED")}
              disabled={isPending}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${vehicle.status === "RETIRED" ? "bg-white/5 text-(--danger)" : "text-white"}`}
            >
              Retired
            </button>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--panel)] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Vehicle Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Model Name</label>
                <input
                  name="nameModel"
                  defaultValue={vehicle.nameModel}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Capacity (kg)</label>
                  <input
                    name="maxLoadCapacity"
                    type="number"
                    defaultValue={vehicle.maxLoadCapacity}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Odometer (km)</label>
                  <input
                    name="odometer"
                    type="number"
                    defaultValue={vehicle.odometer}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent-ink)] hover:brightness-110 transition-all"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
