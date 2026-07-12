"use client";

import { useRef } from "react";

type DatePickerFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
};

export function DatePickerField({ name, label, defaultValue, required }: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  }

  return (
    <label className="space-y-2 md:col-span-1">
      <span className="text-xs uppercase tracking-[0.24em] text-(--muted)">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-2xl border border-white/8 bg-white/6 px-4 py-3 pr-12 text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label={`Open ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-(--muted) transition hover:text-white"
        >
          📅
        </button>
      </div>
    </label>
  );
}