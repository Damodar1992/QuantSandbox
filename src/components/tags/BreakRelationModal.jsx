import React, { memo } from "react";
import { TAG_OBJECT_TYPES } from "../../constants/tags";
import { AppDialog } from "../common/AppDialog";
import { AppButton } from "../common/AppButton";
import { formatTagObjectTypeLabel } from "../../features/tags/utils/tagStore";

export const BreakRelationModal = memo(function BreakRelationModal({
  open,
  onOpenChange,
  relation,
  tagName,
  onConfirm,
  error,
}) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Break relation"
      description="The tag will remain in the registry. Only this link to the object will be removed."
      className="max-w-md"
    >
      <div className="space-y-4 text-[12px]">
        {relation && (
          <div className="rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 space-y-1">
            <div className="text-[#d9d9d9]">
              Tag: <span className="font-medium">{tagName || "—"}</span>
            </div>
            <div className="text-[#a6a6a6]">
              Object:{" "}
              {relation.objectType === TAG_OBJECT_TYPES.HYPEROPT_RESULT
                ? "Hyperopt Result"
                : relation.objectType === TAG_OBJECT_TYPES.STRATEGY
                  ? "Strategy"
                  : relation.objectType === TAG_OBJECT_TYPES.INDICATOR
                    ? "Indicator"
                    : relation.objectType === TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT
                      ? "Mini Backtest Result"
                      : formatTagObjectTypeLabel(relation.objectType)}
            </div>
            <div className="text-[#a6a6a6]">
              Reference: {relation.objectRef}
              <span className="text-[#8c8c8c]"> ({relation.objectId})</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>
            Cancel
          </AppButton>
          <AppButton type="button" variant="default" size="sm" onClick={() => onConfirm?.()}>
            Break relation
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});
