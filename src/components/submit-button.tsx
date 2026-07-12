"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({ label, pendingLabel, className = "", disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`relative transition disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <span className={pending ? "opacity-0" : "opacity-100"}>{label}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
        </span>
      )}
      {!pending && pendingLabel === undefined ? null : null}
    </button>
  );
}
