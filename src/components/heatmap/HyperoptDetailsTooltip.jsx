import React, { memo } from "react";

export const HyperoptDetailsTooltip = memo(function HyperoptDetailsTooltip({ onShowDetails }) {
  return (
    <button
      type="button"
      onClick={() => onShowDetails?.()}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#303030] text-[11px] text-[#8c8c8c] cursor-pointer hover:bg-[#404040] hover:text-[#d9d9d9] transition-colors"
      title="Formulas info"
      aria-label="Show formulas info"
    >
      ⓘ
    </button>
  );
});
