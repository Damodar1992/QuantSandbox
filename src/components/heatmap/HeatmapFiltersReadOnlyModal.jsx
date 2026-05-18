import React, { memo, useMemo } from "react";
import { cx, ui } from "../../constants/ui";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className={cx(ui.radius, "bg-[#141414] border border-[#303030] w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div>
            <div className="text-[14px] font-medium text-[#d9d9d9]">Filters</div>
            <div className={cx("text-[11px] mt-0.5", ui.textMuted)}>
              {item?.type ?? "—"} · {item?.date ?? "—"} · read-only preview
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <HeatmapFiltersReadOnlyPanel snapshot={snapshot} filterPreset="Super filter" />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
