import React from "react";

/**
 * Small presentational icon wrapper for Builder stage labels.
 */
export function StageIcon({ children }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6]">
      {children}
    </span>
  );
}
