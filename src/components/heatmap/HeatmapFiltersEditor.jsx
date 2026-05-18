import React, { memo, useCallback, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "../../constants/heatmap";
import {
  genId,
  FILTER_PRESET_BUILTIN,
  cloneFilterRootWithNewIds,
} from "./heatmapFilterPresets";

export const HeatmapFiltersEditor = memo(function HeatmapFiltersEditor({
  filterRoot,
  onFilterRootChange,
  filterPreset,
  onFilterPresetChange,
  onApply,
  applyLabel = "Apply filter",
}) {
  const [customPresets, setCustomPresets] = useState([]);

  const setRootLogic = useCallback(
    (logic) => onFilterRootChange((prev) => ({ ...prev, rootLogic: logic })),
    [onFilterRootChange],
  );

  const addGroup = useCallback(() => {
    onFilterRootChange((prev) => ({
      ...prev,
      groups: [...prev.groups, { id: genId(), logic: "and", conditions: [] }],
    }));
  }, [onFilterRootChange]);

  const removeGroup = useCallback(
    (groupId) => {
      onFilterRootChange((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== groupId),
      }));
    },
    [onFilterRootChange],
  );

  const setGroupLogic = useCallback(
    (groupId, logic) => {
      onFilterRootChange((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.id === groupId ? { ...g, logic } : g)),
      }));
    },
    [onFilterRootChange],
  );

  const addCondition = useCallback(
    (groupId) => {
      const firstField = HEATMAP_FILTER_KEYS[0];
      onFilterRootChange((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: [...g.conditions, { id: genId(), field: firstField, op: "EQ", value: "" }],
              }
            : g,
        ),
      }));
    },
    [onFilterRootChange],
  );

  const removeCondition = useCallback(
    (groupId, conditionId) => {
      onFilterRootChange((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g,
        ),
      }));
    },
    [onFilterRootChange],
  );

  const updateCondition = useCallback(
    (groupId, conditionId, patch) => {
      onFilterRootChange((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, ...patch } : c)),
              }
            : g,
        ),
      }));
    },
    [onFilterRootChange],
  );

  const applyFilterPreset = useCallback(
    (presetKey) => {
      if (!presetKey) return;
      const builtin = FILTER_PRESET_BUILTIN[presetKey];
      if (builtin) {
        onFilterRootChange(builtin());
        return;
      }
      const custom = customPresets.find((p) => p.name === presetKey);
      if (custom) onFilterRootChange(cloneFilterRootWithNewIds(custom.filter));
    },
    [customPresets, onFilterRootChange],
  );

  const handlePresetChange = useCallback(
    (e) => {
      const value = e.target.value;
      onFilterPresetChange?.(value);
      applyFilterPreset(value);
    },
    [applyFilterPreset, onFilterPresetChange],
  );

  const handleSaveFilterAs = useCallback(() => {
    const name = window.prompt("Enter preset name");
    if (!name || !name.trim()) return;
    setCustomPresets((prev) => [
      ...prev,
      { id: genId(), name: name.trim(), filter: cloneFilterRootWithNewIds(filterRoot) },
    ]);
    onFilterPresetChange?.(name.trim());
  }, [filterRoot, onFilterPresetChange]);

  const handleApply = useCallback(() => {
    onApply?.({ filterRoot, filterPreset });
  }, [filterRoot, filterPreset, onApply]);

  return (
    <div className={cx(ui.radius, ui.panelMuted, "p-3 flex flex-col min-h-0 overflow-x-hidden max-w-full")}>
      <div className="text-[11px] font-medium text-[#d9d9d9] mb-3 shrink-0">Filters</div>
      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <label className={cx("text-[10px] shrink-0", ui.textMuted)}>Filter Preset</label>
            <select
              value={filterPreset || ""}
              onChange={handlePresetChange}
              className={cx(ui.input, "h-8 text-[11px] flex-1 min-w-0")}
            >
              <option value="">—</option>
              {Object.keys(FILTER_PRESET_BUILTIN).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
              {customPresets.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleSaveFilterAs} className={cx(ui.btn, "h-8 px-2 text-[10px] w-full")}>
            Save filter as
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-[#303030]">
            <button
              type="button"
              onClick={() => setRootLogic("and")}
              className={cx(
                "px-3 py-1.5 text-[11px] font-medium",
                filterRoot.rootLogic === "and"
                  ? "bg-rose-600/80 text-white"
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
              )}
            >
              And
            </button>
            <button
              type="button"
              onClick={() => setRootLogic("or")}
              className={cx(
                "px-3 py-1.5 text-[11px] font-medium",
                filterRoot.rootLogic === "or"
                  ? "bg-rose-600/80 text-white"
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
              )}
            >
              Or
            </button>
          </div>
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-2 py-1.5 text-[10px]"
          >
            + Add Group
          </button>
        </div>
        {filterRoot.groups.map((group) => (
          <div
            key={group.id}
            className="rounded-lg border border-[#303030] bg-[#141414] overflow-hidden border-l-4 border-l-sky-500/50"
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-sky-500/10 border-b border-[#303030]">
              <button
                type="button"
                onClick={() => removeGroup(group.id)}
                className="text-red-400/90 hover:text-red-300 p-0.5 rounded text-[14px] leading-none"
                aria-label="Remove group"
              >
                ×
              </button>
              <div className="flex rounded overflow-hidden border border-[#303030]">
                <button
                  type="button"
                  onClick={() => setGroupLogic(group.id, "and")}
                  className={cx(
                    "px-2 py-1 text-[10px] font-medium",
                    group.logic === "and" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
                  )}
                >
                  And
                </button>
                <button
                  type="button"
                  onClick={() => setGroupLogic(group.id, "or")}
                  className={cx(
                    "px-2 py-1 text-[10px] font-medium",
                    group.logic === "or" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
                  )}
                >
                  Or
                </button>
              </div>
              <span className="text-[10px] text-sky-200/90">Group</span>
              <button
                type="button"
                onClick={() => addCondition(group.id)}
                className="inline-flex items-center justify-center rounded border border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-2 py-1 text-[10px] ml-auto"
              >
                + Add Condition
              </button>
            </div>
            <div className="p-2 space-y-2 overflow-x-hidden min-w-0">
              {group.conditions.length === 0 ? (
                <div className="text-[10px] text-[#595959] py-2 px-3">No conditions. Add a condition above.</div>
              ) : (
                group.conditions.map((cond) => {
                  const noValue = cond.op === "IS_NULL" || cond.op === "IS_NOT_NULL";
                  return (
                    <div
                      key={cond.id}
                      className="flex items-center gap-1 py-1.5 px-1.5 rounded border border-[#303030]/50 bg-[#0f0f0f] min-w-0 max-w-full"
                    >
                      <button
                        type="button"
                        onClick={() => removeCondition(group.id, cond.id)}
                        className="text-red-400/90 hover:text-red-300 p-0.5 rounded text-[14px] leading-none shrink-0"
                        aria-label="Remove condition"
                      >
                        ×
                      </button>
                      <select
                        value={cond.field}
                        onChange={(e) => updateCondition(group.id, cond.id, { field: e.target.value })}
                        className={cx(ui.input, "h-6 text-[10px] flex-[1.15] min-w-0 bg-sky-900/30 border-sky-500/50 text-sky-100")}
                        title={cond.field}
                      >
                        {HEATMAP_FILTER_KEYS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <select
                        value={cond.op}
                        onChange={(e) => updateCondition(group.id, cond.id, { op: e.target.value })}
                        className={cx(ui.input, "h-6 text-[10px] flex-1 min-w-0 bg-emerald-900/30 border-emerald-500/50 text-emerald-100")}
                        title={FILTER_OPERATIONS.find((op) => op.value === cond.op)?.label ?? cond.op}
                      >
                        {FILTER_OPERATIONS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      {noValue ? (
                        <span className="text-[10px] text-[#595959] flex-[0.8] min-w-0 truncate">(no value)</span>
                      ) : (
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                          placeholder="Value"
                          className={cx(ui.input, "h-6 text-[10px] flex-[0.8] min-w-0 bg-[#1a1a1a] text-[#d9d9d9]")}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleApply} className={cx(ui.btnPrimary, "w-full h-8 mt-3 text-[11px] shrink-0")}>
        {applyLabel}
      </button>
    </div>
  );
});
