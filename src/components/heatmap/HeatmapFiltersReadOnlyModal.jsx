import React, { memo, useMemo } from "react";
import { AppButton } from "../common/AppButton";
import { AppDialog } from "../common/AppDialog";
import { FILTER_PRESET_BUILTIN } from "./heatmapFilterPresets";
import { HeatmapFiltersReadOnlyPanel } from "./HeatmapFiltersReadOnlyPanel";

function valueFromSeed(seed, index) {
  let h = 2166136261;
  const str = `${seed}#${index}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 4294967296;
  return Math.round((0.01 + u * 0.99) * 10000) / 10000;
}

export const HeatmapFiltersReadOnlyModal = memo(function HeatmapFiltersReadOnlyModal({ item, onClose }) {
  const snapshot = useMemo(() => {
    const base = FILTER_PRESET_BUILTIN["Super filter"]();
    let i = 0;
    return {
      rootLogic: base.rootLogic,
      groups: base.groups.map((g) => ({
        ...g,
        conditions: g.conditions.map((c) => ({
          ...c,
          displayValue: c.op === "IS_NULL" || c.op === "IS_NOT_NULL" ? "" : String(valueFromSeed(item?.id ?? "row", i++)),
        })),
      })),
    };
  }, [item?.id]);

  return (
    <AppDialog
      open={!!item}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Filters"
      description={`${item?.type ?? "—"} · ${item?.date ?? "—"} · read-only preview`}
      className="max-w-2xl max-h-[90vh] overflow-auto"
    >
      <div className="space-y-4">
        <HeatmapFiltersReadOnlyPanel snapshot={snapshot} filterPreset="Super filter" />
        <div className="flex justify-end">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});
