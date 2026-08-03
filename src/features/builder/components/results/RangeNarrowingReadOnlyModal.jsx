import React, { memo } from "react";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { RangeNarrowingFormFields } from "./RangeNarrowingFormFields";

const NOOP = () => {};

export const RangeNarrowingReadOnlyModal = memo(function RangeNarrowingReadOnlyModal({
  open,
  runConfig,
  onClose,
}) {
  const {
    plateauWidth = 0,
    minImportance = 0,
    maxCombinations = 0,
    minEpochsPerValue = 0,
    marginEnabled = false,
    marginWiden = 0,
  } = runConfig || {};

  return (
    <AppDialog
      open={!!open && !!runConfig}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Range Narrowing — run settings"
      className="max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="overflow-auto max-h-[min(70vh,520px)] space-y-4 opacity-90">
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

      <div className="flex justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});
