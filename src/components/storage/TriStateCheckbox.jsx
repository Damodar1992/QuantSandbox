/**
 * Tri-state checkbox: "selected" | "partial" | "none".
 * Uses native <input type="checkbox"> + ref.indeterminate for the partial state.
 * No new shadcn dependencies.
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function TriStateCheckbox({ state, onChange, className, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.checked = state === "selected";
    ref.current.indeterminate = state === "partial";
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      onChange={onChange}
      className={cn(
        "h-3.5 w-3.5 cursor-pointer rounded border accent-violet-500 border-border",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    />
  );
}
