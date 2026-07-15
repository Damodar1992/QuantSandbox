import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";

export const RangeNarrowingFormFields = memo(function RangeNarrowingFormFields({
  plateauWidth,
  onPlateauWidthChange,
  minImportance,
  onMinImportanceChange,
  maxCombinations,
  onMaxCombinationsChange,
  minEpochsPerValue,
  onMinEpochsPerValueChange,
  marginEnabled,
  onMarginEnabledChange,
  marginWiden,
  onMarginWidenChange,
  readOnly = false,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-[#d9d9d9]">
            Plateau width: <span className="text-violet-300">{plateauWidth}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={plateauWidth}
            disabled={readOnly}
            onChange={(e) => onPlateauWidthChange(Number(e.target.value))}
            className="w-full h-2 accent-violet-500"
          />
          <div className="text-[10px] text-[#8c8c8c]">0% = peak only, 100% = whole curve.</div>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-[#d9d9d9]">
            Min importance to keep: <span className="text-violet-300">{minImportance}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={minImportance}
            disabled={readOnly}
            onChange={(e) => onMinImportanceChange(Number(e.target.value))}
            className="w-full h-2 accent-violet-500"
          />
          <div className="text-[10px] text-[#8c8c8c]">Importance below this → parameter gets fixed.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">Max combinations</label>
          <input
            type="number"
            min={1}
            value={maxCombinations}
            disabled={readOnly}
            onChange={(e) => onMaxCombinationsChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">Min. epochs per value</label>
          <input
            type="number"
            min={1}
            value={minEpochsPerValue}
            disabled={readOnly}
            onChange={(e) => onMinEpochsPerValueChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
          <div className="text-[10px] text-[#8c8c8c] leading-snug">Minimum rows per value</div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[#303030] bg-[#0f0f0f]/50 p-3">
        <button
          type="button"
          role="switch"
          aria-checked={marginEnabled}
          disabled={readOnly}
          onClick={() => !readOnly && onMarginEnabledChange(!marginEnabled)}
          className={cx(
            "relative shrink-0 mt-0.5 h-6 w-10 rounded-full border-2 transition-colors",
            marginEnabled ? "bg-violet-600 border-violet-500" : "bg-[#303030] border-[#404040]",
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              marginEnabled ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5",
            )}
          />
        </button>
        <div>
          <div className="text-[12px] font-medium text-[#d9d9d9]">Also generate config «margin» (safety range)</div>
        </div>
      </div>

      {marginEnabled && (
        <div className="flex flex-col gap-1.5">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">
            Margin widen (steps, for the &ldquo;margin&rdquo; config)
          </label>
          <input
            type="number"
            min={0}
            value={marginWiden}
            disabled={readOnly}
            onChange={(e) => onMarginWidenChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
        </div>
      )}
    </div>
  );
});
