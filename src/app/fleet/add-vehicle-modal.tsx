"use client";

import { useState } from "react";
import { addVehicle } from "./actions";

export function AddVehicleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await addVehicle(formData);

    setLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || "An unknown error occurred.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--background)] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Add New Vehicle</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)] border border-[var(--danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted-2)]">Registration Number</label>
            <input
              required
              name="registrationNumber"
              placeholder="e.g. GJ01AB1234"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--muted-2)]">Model / Name</label>
            <input
              required
              name="nameModel"
              placeholder="e.g. Ford Transit Van"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--muted-2)]">Vehicle Type</label>
            <select
              required
              name="type"
              className="w-full rounded-xl border border-white/10 bg-[#161618] p-3 text-white outline-none focus:border-[var(--accent)]"
            >
              <option value="Van">Van</option>
              <option value="Mini Truck">Mini Truck</option>
              <option value="Truck">Truck</option>
              <option value="Heavy Duty">Heavy Duty</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted-2)]">Max Load (kg)</label>
              <input
                required
                type="number"
                name="maxLoadCapacity"
                min="0"
                placeholder="e.g. 1000"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted-2)]">Acquisition Cost ($)</label>
              <input
                required
                type="number"
                name="acquisitionCost"
                min="0"
                placeholder="e.g. 25000"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#ff9533] disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
