import React, { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../../constants/ui";
import { RangeNarrowingFormFields } from "./RangeNarrowingFormFields";

const DEFAULT_FORM = {
  plateauWidth: 50,
  minImportance: 2,
  maxCombinations: 120,
  minEpochsPerValue: 5,
  marginEnabled: false,
  marginWiden: 2,
};

export const AddRangeNarrowingModal = memo(function AddRangeNarrowingModal({
  open,
  onClose,
  onRun,
}) {
  const [plateauWidth, setPlateauWidth] = useState(DEFAULT_FORM.plateauWidth);
  const [minImportance, setMinImportance] = useState(DEFAULT_FORM.minImportance);
  const [maxCombinations, setMaxCombinations] = useState(DEFAULT_FORM.maxCombinations);
  const [minEpochsPerValue, setMinEpochsPerValue] = useState(DEFAULT_FORM.minEpochsPerValue);
  const [marginEnabled, setMarginEnabled] = useState(DEFAULT_FORM.marginEnabled);
  const [marginWiden, setMarginWiden] = useState(DEFAULT_FORM.marginWiden);

  useEffect(() => {
    if (open) {
      setPlateauWidth(DEFAULT_FORM.plateauWidth);
      setMinImportance(DEFAULT_FORM.minImportance);
      setMaxCombinations(DEFAULT_FORM.maxCombinations);
      setMinEpochsPerValue(DEFAULT_FORM.minEpochsPerValue);
      setMarginEnabled(DEFAULT_FORM.marginEnabled);
      setMarginWiden(DEFAULT_FORM.marginWiden);
    }
  }, [open]);

  if (!open) return null;

  const handleRun = () => {
    onRun?.({
      plateauWidth,
      minImportance,
      maxCombinations,
      minEpochsPerValue,
      marginEnabled,
      marginWiden,
    });
    onClose?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className={cx(
          ui.radius,
          "bg-[#141414] border border-[#303030] max-w-[560px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <span className="text-[14px] font-medium text-[#d9d9d9]">Add Range Narrowing</span>
          <button type="button" onClick={onClose} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">
            ✕
          </button>
        </div>

        <div className="overflow-auto p-4 flex-1 min-h-0 space-y-4">
          <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] text-violet-200 leading-snug">
            Fallback path — use this when the post-processing run already finished{" "}
            <em>without</em> range narrowing enabled.
            Computes on top of the existing report, no recompute of Stability/Score formulas. Target metric is fixed
            to <strong className="text-violet-100">final_score</strong>; native step is computed automatically from
            the report&apos;s tested values.
          </div>

          <RangeNarrowingFormFields
            plateauWidth={plateauWidth}
            onPlateauWidthChange={setPlateauWidth}
            minImportance={minImportance}
            onMinImportanceChange={setMinImportance}
            maxCombinations={maxCombinations}
            onMaxCombinationsChange={setMaxCombinations}
            minEpochsPerValue={minEpochsPerValue}
            onMinEpochsPerValueChange={setMinEpochsPerValue}
            marginEnabled={marginEnabled}
            onMarginEnabledChange={setMarginEnabled}
            marginWiden={marginWiden}
            onMarginWidenChange={setMarginWiden}
          />
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
            Cancel
          </button>
          <button type="button" onClick={handleRun} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>
            Run range narrowing
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
