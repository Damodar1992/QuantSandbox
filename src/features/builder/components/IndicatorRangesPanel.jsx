import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { SelectedIndicatorCard, indicatorRangesListClass } from "./SelectedIndicatorCard";

export function TotalCombinationsBadge({ totalCombinations = 0, className }) {
  return (
    <div
      className={cx(
        "shrink-0 rounded-full border px-3 py-1 text-[11px]",
        totalCombinations > 10_000_000
          ? "border-red-500/50 bg-red-500/10 text-red-300"
          : totalCombinations > 0
            ? "border-violet-500/40 bg-violet-500/10 text-[#ddd6fe]"
            : "border-[rgba(60,40,80,0.5)] bg-[#19102b]/60 text-[#b8aecc]",
        className,
      )}
    >
      Total combinations:{" "}
      <span className="font-semibold">{totalCombinations.toLocaleString()}</span>
    </div>
  );
}

export const IndicatorRangesPanel = memo(function IndicatorRangesPanel({
  indicators,
  totalCombinations,
  onEditRanges,
}) {
  const list = indicators || [];

  if (!list.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-6 text-center text-[12px]", ui.textMuted)}>
        Add indicators in section 1, then set parameter ranges here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={indicatorRangesListClass}>
        {list.map((ind) => (
          <SelectedIndicatorCard
            key={ind.id}
            indicator={ind}
            defaultExpanded={false}
            onEditRanges={() => onEditRanges?.(ind)}
          />
        ))}
      </div>
    </div>
  );
});
