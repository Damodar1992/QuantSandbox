import React, { memo, useEffect, useState } from "react";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { RangeNarrowingFormFields } from "./RangeNarrowingFormFields";

const DEFAULT_FORM = {
  plateauWidth: 50,
  minImportance: 2,
  maxCombinations: 120,
  minEpochsPerValue: 5,
  marginEnabled: true,
  marginWiden: 2,
};

export const AddRangeNarrowingModal = memo(function AddRangeNarrowingModal({
  open,
  onClose,
  onRun,
  originalCombinations = 20000,
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

  const combinationsLabel = Number(originalCombinations).toLocaleString();

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Parameter Importance & Range Narrowing"
      description="Measures how strongly each indicator parameter drives the final score, narrows ranges for important parameters and fixes the rest."
      className="max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="overflow-auto flex-1 min-h-0 space-y-4 max-h-[min(70vh,560px)]">
        <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 flex items-baseline justify-center gap-2">
          <div className="text-[22px] font-semibold text-[#d9d9d9] tabular-nums">
            {combinationsLabel}
          </div>
          <div className="text-[10px] text-[#8c8c8c]">original combinations</div>
        </div>

        <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] text-violet-200 leading-snug">
          The analysis runs on top of the completed post-processing (analyzer) report only: no new
          hyperopt runs, no recompute of Stability/Score formulas. Target metric is fixed to the{" "}
          <strong className="text-violet-100">final score</strong> computed by the analyzer; the grid
          step of every parameter is detected automatically from the report&apos;s tested values.
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

        <div className="text-[11px] text-[#8c8c8c] leading-snug">
          After the run you will see a results screen: importance of every parameter, the suggested
          narrowed ranges with steps, and the total number of combinations for the next hyperopt.
          Nothing is applied automatically — you review the result first.
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton type="button" variant="default" size="sm" onClick={handleRun}>
          Run range narrowing
        </AppButton>
      </div>
    </AppDialog>
  );
});
