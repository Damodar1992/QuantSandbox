import React, { memo } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../../constants/ui";
import { RangeNarrowingFormFields } from "./RangeNarrowingFormFields";

const NOOP = () => {};

export const RangeNarrowingReadOnlyModal = memo(function RangeNarrowingReadOnlyModal({
  open,
  runConfig,
  onClose,
}) {
  if (!open || !runConfig) return null;

  const {
    plateauWidth = 0,
    minImportance = 0,
    maxCombinations = 0,
    minEpochsPerValue = 0,
    marginEnabled = false,
    marginWiden = 0,
  } = runConfig;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className={cx(
          ui.radius,
          "bg-[#141414] border border-[#303030] max-w-[560px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <span className="text-[14px] font-medium text-[#d9d9d9]">Range Narrowing — run settings</span>
          <button type="button" onClick={onClose} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">
            ✕
          </button>
        </div>

        <div className="overflow-auto p-4 flex-1 min-h-0 space-y-4 pointer-events-none opacity-90">
          <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] text-violet-200 leading-snug">
            Read-only snapshot of parameters used for this Range Narrowing run.
          </div>

          <RangeNarrowingFormFields
            readOnly
            plateauWidth={plateauWidth}
            onPlateauWidthChange={NOOP}
            minImportance={minImportance}
            onMinImportanceChange={NOOP}
            maxCombinations={maxCombinations}
            onMaxCombinationsChange={NOOP}
            minEpochsPerValue={minEpochsPerValue}
            onMinEpochsPerValueChange={NOOP}
            marginEnabled={marginEnabled}
            onMarginEnabledChange={NOOP}
            marginWiden={marginWiden}
            onMarginWidenChange={NOOP}
          />
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end">
          <button type="button" onClick={onClose} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
