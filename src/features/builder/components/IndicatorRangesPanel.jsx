import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          className={cx(
            "text-[11px] shrink-0 rounded-md border px-2 py-1.5",
            totalCombinations > 10_000_000
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : totalCombinations > 0
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]",
          )}
        >
          Total combinations: <span className="font-medium">{totalCombinations.toLocaleString()}</span>
        </div>
      </div>

      <div className={cx(ui.radius, ui.panel, "overflow-hidden border border-[#303030]")}>
        <div className="divide-y divide-[#303030]/60">
          {list.map((ind) => (
            <div
              key={ind.id}
              className="flex items-center gap-2 py-2 px-3 hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-[#d9d9d9] truncate">
                    {ind.displayName || ind.name}
                  </span>
                  <span className="text-[9px] text-[#595959] font-mono truncate">{ind.type}</span>
                </div>
                <div className={cx("text-[10px] mt-0.5 truncate", ui.textMuted)}>
                  {(ind.params || [])
                    .map((p) => `${p.label}: ${p.min}–${p.max} (step ${p.step})`)
                    .join(" · ") || "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditRanges?.(ind)}
                className={cx(ui.btnPrimary, "h-7 px-2 text-[10px] whitespace-nowrap shrink-0")}
              >
                Edit ranges
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
