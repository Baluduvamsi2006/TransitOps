"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { editVehicleDetails, updateVehicleStatus, saveVehicleDocument, deleteVehicleDocument } from "./actions";

export function VehicleActionMenu({ vehicle }: { vehicle: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDocSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const docName = formData.get("docName") as string;
    const docUrl = formData.get("docUrl") as string;
    
    startTransition(async () => {
      await saveVehicleDocument(vehicle.id, docName, docUrl);
      // Don't close modal so they can add multiple, just reset form
      (e.target as HTMLFormElement).reset();
    });
  };

  const handleDocDelete = async (index: number) => {
    startTransition(async () => {
      await deleteVehicleDocument(vehicle.id, index);
    });
  };

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
            <button
              onClick={() => { setIsDocsModalOpen(true); setIsOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            >
              Manage Documents
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
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-(--panel) p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Vehicle Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--muted)">Model Name</label>
                <input
                  name="nameModel"
                  defaultValue={vehicle.nameModel}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-(--muted) focus:border-(--accent) focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-(--muted)">Capacity (kg)</label>
                  <input
                    name="maxLoadCapacity"
                    type="number"
                    defaultValue={vehicle.maxLoadCapacity}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-(--muted) focus:border-(--accent) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-(--muted)">Odometer (km)</label>
                  <input
                    name="odometer"
                    type="number"
                    defaultValue={vehicle.odometer}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-(--muted) focus:border-(--accent) focus:outline-none"
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
                  className="flex-1 rounded-xl bg-(--accent) px-4 py-3 text-sm font-bold text-(--accent-ink) hover:brightness-110 transition-all"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDocsModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-(--panel) p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Manage Documents</h3>
            
            {/* List Existing Documents */}
            <div className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-2">
              {Array.isArray(vehicle.documents) && vehicle.documents.length > 0 ? (
                vehicle.documents.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm border border-white/10">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-(--info) hover:underline truncate mr-4">
                      {doc.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDocDelete(index)}
                      className="text-(--danger) hover:brightness-110 font-semibold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-(--muted-2) italic">No documents attached.</p>
              )}
            </div>

            {/* Add New Document */}
            <form onSubmit={handleDocSubmit} className="space-y-4 border-t border-white/10 pt-4">
              <h4 className="text-sm font-medium text-(--muted) uppercase tracking-widest">Add New Link</h4>
              <div>
                <input
                  name="docName"
                  placeholder="Document Name (e.g. Insurance)"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-(--muted) focus:border-(--accent) focus:outline-none mb-3"
                />
                <input
                  name="docUrl"
                  type="url"
                  placeholder="URL (e.g. Google Drive Link)"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-(--muted) focus:border-(--accent) focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDocsModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-(--accent) px-4 py-2.5 text-sm font-bold text-(--accent-ink) hover:brightness-110 transition-all"
                >
                  {isPending ? "Adding..." : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
