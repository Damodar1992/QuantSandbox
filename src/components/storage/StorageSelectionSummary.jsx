/**
 * Selection summary bar for Storage page.
 * Shows selected count, eligible count, space to release, and action buttons.
 */

import React from "react";
import { cx } from "../../constants/ui";
import { AppButton } from "../common";

function fmt(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(2)} GB`;
}

export function StorageSelectionSummary({
  selectionSummary,
  onClearSelection,
  onDeleteRAWData,
  disabled,
}) {
  const { selectedCount, eligibleCount, spaceToRelease } = selectionSummary;

  if (selectedCount === 0) return null;

  const canDelete = eligibleCount > 0 && !disabled;

  return (
    <div className="flex items-center gap-3 flex-wrap rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="text-violet-300 font-semibold">{selectedCount}</span>
        <span className="text-muted-foreground">hyperopt{selectedCount !== 1 ? "s" : ""} selected</span>

        {eligibleCount < selectedCount && (
          <>
            <span className="text-border">·</span>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{eligibleCount}</span> eligible for deletion
            </span>
          </>
        )}
      </div>

      {eligibleCount > 0 && (
        <>
          <span className="text-border">·</span>
          <div className="text-[12px]">
            <span className="text-muted-foreground">Space to release: </span>
            <span className="font-semibold text-emerald-400">{fmt(spaceToRelease)}</span>
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Clear selection
        </button>

        <AppButton
          variant="destructive"
          size="sm"
          onClick={onDeleteRAWData}
          disabled={!canDelete}
          title={
            !canDelete && eligibleCount === 0
              ? "No eligible hyperopts selected (all are already deleted or running)"
              : undefined
          }
        >
          Delete RAW Data
        </AppButton>
      </div>
    </div>
  );
}
