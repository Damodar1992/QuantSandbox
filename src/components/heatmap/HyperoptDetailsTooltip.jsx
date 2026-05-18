import React, { memo } from "react";

export const HyperoptDetailsTooltip = memo(function HyperoptDetailsTooltip({
  onShowDetails,
  title = "Formulas info",
  ariaLabel = "Show formulas info",
}) {
  return (
    <button
      type="button"
      onClick={() => onShowDetails?.()}
      className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-[#303030] text-[11px] text-[#8c8c8c] cursor-pointer hover:bg-[#404040] hover:text-[#d9d9d9] transition-colors"
      title={title}
      aria-label={ariaLabel}
    >
      Info
    </button>
  );
});
