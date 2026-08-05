import React, { memo, useEffect, useState } from "react";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { HeatmapFiltersEditor } from "../../../../components/heatmap";
import {
  DEFAULT_FILTER_ROOT,
  filterRootToFiltersConfig,
} from "../../../../components/heatmap/heatmapFilterPresets";

/**
 * Filter setup for a new Comparison Widget entry: the quant picks which epochs
 * of the current stage take part, then the entry appears in the Analytics table.
 */
export const AddComparisonWidgetModal = memo(function AddComparisonWidgetModal({
  open,
  currentStage,
  onClose,
  onRun,
}) {
  const [filterRoot, setFilterRoot] = useState(DEFAULT_FILTER_ROOT);
  const [filterPreset, setFilterPreset] = useState("");

  useEffect(() => {
    if (open) {
      setFilterRoot(DEFAULT_FILTER_ROOT());
      setFilterPreset("");
    }
  }, [open]);

  const handleApply = ({ filterRoot: nextRoot, filterPreset: nextPreset }) => {
    onRun?.({
      filters: filterRootToFiltersConfig(nextRoot),
      filterPreset: nextPreset || "",
    });
    onClose?.();
  };

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Comparison widget"
      description="Filter the current-stage epochs that take part in the comparison against previous stage baselines."
      className="max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto">
        <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] leading-snug text-violet-200">
          The comparison runs on the completed post-processing report:{" "}
          {currentStage ? `all Stage ${currentStage} epochs` : "all current-stage epochs"} that pass these
          filters are compared with the epoch you selected on every previous stage of this lineage. The
          baseline epochs themselves are never filtered out.
        </div>

        <HeatmapFiltersEditor
          filterRoot={filterRoot}
          onFilterRootChange={setFilterRoot}
          filterPreset={filterPreset}
          onFilterPresetChange={setFilterPreset}
          onApply={handleApply}
          applyLabel="Create comparison widget"
        />

        <div className="text-[11px] leading-snug text-[#8c8c8c]">
          Leave the filters empty to compare every epoch of the current stage. The entry is saved to the
          Analytics table, where you can review these filters and open the widget at any time.
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </AppButton>
      </div>
    </AppDialog>
  );
});
