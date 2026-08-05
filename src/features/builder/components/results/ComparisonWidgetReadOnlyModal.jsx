import React, { memo, useMemo } from "react";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { HeatmapFiltersReadOnlyPanel, filtersConfigToSnapshot } from "../../../../components/heatmap";
import { countFilterConditions } from "../../utils/analyticsItems";

/** Read-only view of the filters saved with a Comparison Widget entry. */
export const ComparisonWidgetReadOnlyModal = memo(function ComparisonWidgetReadOnlyModal({
  open,
  item,
  onClose,
}) {
  const filters = item?.runConfig?.filters;
  const snapshot = useMemo(() => filtersConfigToSnapshot(filters), [filters]);
  const conditionCount = countFilterConditions(filters);

  return (
    <AppDialog
      open={!!open && !!item}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Comparison widget — filters"
      description={`${item?.type ?? "—"} · ${item?.date ?? "—"} · read-only snapshot`}
      className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto">
        <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] leading-snug text-violet-200">
          {conditionCount > 0
            ? `Current-stage epochs were limited by ${conditionCount} ${conditionCount === 1 ? "condition" : "conditions"} when this comparison was created.`
            : "No filters were applied: every epoch of the current stage takes part in this comparison."}
        </div>

        {snapshot ? (
          <HeatmapFiltersReadOnlyPanel
            snapshot={snapshot}
            filterPreset={item?.runConfig?.filterPreset || ""}
          />
        ) : null}
      </div>

      <div className="flex justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});
