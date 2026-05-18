import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { FILTER_OPERATIONS } from "../../constants/heatmap";

function opLabel(op) {
  return FILTER_OPERATIONS.find((o) => o.value === op)?.label ?? op;
}

export function filtersConfigToSnapshot(filters) {
  if (!filters?.groups?.length) return null;
  return {
    rootLogic: filters.logic === "or" ? "or" : "and",
    groups: filters.groups.map((g, gi) => ({
      id: g.id || `g-${gi}`,
      logic: g.logic === "or" ? "or" : "and",
      conditions: (g.conditions || []).map((c, ci) => ({
        id: c.id || `c-${gi}-${ci}`,
        field: c.field,
        op: c.op,
        displayValue:
          c.op === "IS_NULL" || c.op === "IS_NOT_NULL"
            ? ""
            : c.value != null && String(c.value).trim() !== ""
              ? String(c.value)
              : "",
      })),
    })),
  };
}

export const HeatmapFiltersReadOnlyPanel = memo(function HeatmapFiltersReadOnlyPanel({
  snapshot,
  filterPreset,
  className,
}) {
  if (!snapshot?.groups?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-3", className)}>
        <div className="text-[11px] font-medium text-[#d9d9d9] mb-2">Filters</div>
        <p className={cx("text-[11px]", ui.textMuted)}>No filters were applied for this heatmap.</p>
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panelMuted, "p-3", className)}>
      <div className="text-[11px] font-medium text-[#d9d9d9] mb-3">Filters</div>
      {filterPreset ? (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cx("text-[10px]", ui.textMuted)}>Filter Preset</span>
          <span className={cx(ui.input, "h-8 text-[11px] min-w-[160px] pointer-events-none select-none flex items-center px-2 bg-[#1a1a1a]")}>
            {filterPreset}
          </span>
        </div>
      ) : null}
      <div className="space-y-3 max-h-[min(420px,50vh)] overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-[#303030] pointer-events-none select-none">
            <span
              className={cx(
                "px-3 py-1.5 text-[11px] font-medium",
                snapshot.rootLogic === "and" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c]",
              )}
            >
              And
            </span>
            <span
              className={cx(
                "px-3 py-1.5 text-[11px] font-medium",
                snapshot.rootLogic === "or" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c]",
              )}
            >
              Or
            </span>
          </div>
        </div>
        {snapshot.groups.map((group) => (
          <div
            key={group.id}
            className="rounded-lg border border-[#303030] bg-[#141414] overflow-hidden border-l-4 border-l-sky-500/50"
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-sky-500/10 border-b border-[#303030]">
              <div className="flex rounded overflow-hidden border border-[#303030] pointer-events-none select-none">
                <span
                  className={cx(
                    "px-2 py-1 text-[10px] font-medium",
                    group.logic === "and" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c]",
                  )}
                >
                  And
                </span>
                <span
                  className={cx(
                    "px-2 py-1 text-[10px] font-medium",
                    group.logic === "or" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c]",
                  )}
                >
                  Or
                </span>
              </div>
              <span className="text-[10px] text-sky-200/90">Group</span>
            </div>
            <div className="p-2 space-y-2 overflow-x-auto min-w-0">
              {group.conditions.length === 0 ? (
                <div className="text-[10px] text-[#595959] py-2 px-3">No conditions.</div>
              ) : (
                group.conditions.map((cond) => {
                  const noValue = cond.op === "IS_NULL" || cond.op === "IS_NOT_NULL";
                  return (
                    <div
                      key={cond.id}
                      className="flex flex-nowrap items-center gap-1.5 py-1.5 px-2 rounded border border-[#303030]/50 bg-[#0f0f0f] min-w-0"
                    >
                      <div
                        className={cx(
                          ui.input,
                          "h-6 text-[10px] flex-1 min-w-0 bg-sky-900/30 border-sky-500/50 text-sky-100 pointer-events-none select-none flex items-center px-2",
                        )}
                      >
                        {cond.field}
                      </div>
                      <div
                        className={cx(
                          ui.input,
                          "h-6 text-[10px] flex-1 min-w-0 bg-emerald-900/30 border-emerald-500/50 text-emerald-100 pointer-events-none select-none flex items-center px-2",
                        )}
                      >
                        {opLabel(cond.op)}
                      </div>
                      {noValue ? (
                        <span className="text-[10px] text-[#595959] flex-1 min-w-0">(no value)</span>
                      ) : (
                        <div
                          className={cx(
                            ui.input,
                            "h-6 text-[10px] flex-1 min-w-0 bg-[#1a1a1a] text-[#d9d9d9] pointer-events-none select-none flex items-center px-2",
                          )}
                        >
                          {cond.displayValue || "—"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
