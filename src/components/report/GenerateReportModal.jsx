import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "../../constants/heatmap";
import { genId, FILTER_PRESET_BUILTIN, cloneFilterRootWithNewIds } from "../heatmap/heatmapFilterPresets";

export const GenerateReportModal = memo(({ onClose, onGenerate }) => {
  // Локальное состояние фильтра для Report (НЕ связано с HeatMap)
  const [filterRoot, setFilterRoot] = useState(() => ({
    rootLogic: "and",
    groups: [],
  }));

  const [filterPreset, setFilterPreset] = useState("");
  const [customPresets, setCustomPresets] = useState([]);

  const setRootLogic = (logic) => {
    setFilterRoot((prev) => ({ ...prev, rootLogic: logic }));
  };

  const addGroup = () => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: [
        ...prev.groups,
        {
          id: genId(),
          logic: "and",
          conditions: [],
        },
      ],
    }));
  };

  const removeGroup = (groupId) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }));
  };

  const setGroupLogic = (groupId, logic) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, logic } : g)),
    }));
  };

  const addCondition = (groupId) => {
    const firstField = HEATMAP_FILTER_KEYS[0];
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [
                ...g.conditions,
                {
                  id: genId(),
                  field: firstField,
                  op: FILTER_OPERATIONS[0]?.value ?? "EQ",
                  value: "",
                },
              ],
            }
          : g,
      ),
    }));
  };

  const removeCondition = (groupId, condId) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== condId) } : g,
      ),
    }));
  };

  const updateCondition = (groupId, condId, patch) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) => (c.id === condId ? { ...c, ...patch } : c)),
            }
          : g,
      ),
    }));
  };

  const handlePresetChange = (e) => {
    const presetKey = e.target.value;
    setFilterPreset(presetKey);
    if (!presetKey) {
      setFilterRoot({ rootLogic: "and", groups: [] });
      return;
    }
    const custom = customPresets.find((p) => p.name === presetKey);
    if (custom) {
      setFilterRoot(cloneFilterRootWithNewIds(custom.filter));
      return;
    }
    const builtin = FILTER_PRESET_BUILTIN[presetKey];
    if (builtin) {
      setFilterRoot(cloneFilterRootWithNewIds(builtin()));
    }
  };

  const handleSaveFilterAsClick = () => {
    const name = window.prompt("Save current filter as:");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomPresets((prev) => [
      ...prev,
      { id: genId(), name: trimmed, filter: cloneFilterRootWithNewIds(filterRoot) },
    ]);
    setFilterPreset(trimmed);
  };

  const handleGenerate = () => {
    const filters = {
      logic: filterRoot.rootLogic,
      groups: filterRoot.groups.map((g) => ({
        logic: g.logic,
        conditions: g.conditions.map((c) => ({ field: c.field, op: c.op, value: c.value })),
      })),
    };
    onGenerate?.({ filters });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={cx(ui.radius, ui.panel, "w-full max-w-2xl max-h-[90vh] overflow-auto")}>
        <div className={cx("px-4 py-3 flex items-center justify-between", ui.panelMuted, "border-0 border-b", ui.divider)}>
          <div>
            <div className="text-[14px] font-medium text-[#d9d9d9]">Generate Report</div>
            <div className={cx("text-[11px]", ui.textMuted)}>Configure parameters for report generation</div>
          </div>
          <button onClick={onClose} className={cx(ui.btn, "h-7 px-2 text-[11px]")}>
            ✕ Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Filters card — функционал как у HeatMap, но состояние независимое */}
          <div className="rounded-lg bg-[#141414] border border-[#303030] overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="rounded-lg bg-[#1f1f1f] border border-[#303030] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] font-medium text-[#d9d9d9]">Filters</div>
                  <button
                    type="button"
                    onClick={handleSaveFilterAsClick}
                    className={cx(ui.btnGhost, "h-7 px-2 text-[11px]")}
                  >
                    Save filter as
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[10px] text-[#8c8c8c]">Filter Preset</label>
                    <select
                      value={filterPreset}
                      onChange={handlePresetChange}
                      className={cx(ui.input, "h-8 text-[11px] min-w-[160px]")}
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
                      className="inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-2 py-1.5 text-[11px]"
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
                              group.logic === "and"
                                ? "bg-rose-600/80 text-white"
                                : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
                            )}
                          >
                            And
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupLogic(group.id, "or")}
                            className={cx(
                              "px-2 py-1 text-[10px] font-medium",
                              group.logic === "or"
                                ? "bg-rose-600/80 text-white"
                                : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]",
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
                      <div className="p-2 space-y-2 overflow-x-auto min-w-0">
                        {group.conditions.length === 0 ? (
                          <div className="text-[10px] text-[#595959] py-2 px-3">
                            No conditions. Add a condition above.
                          </div>
                        ) : (
                          group.conditions.map((cond) => {
                            const noValue = cond.op === "IS_NULL" || cond.op === "IS_NOT_NULL";
                            return (
                              <div
                                key={cond.id}
                                className="flex flex-nowrap items-center gap-1.5 py-1.5 px-2 rounded border border-[#303030]/50 bg-[#0f0f0f] min-w-0"
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
                                  onChange={(e) =>
                                    updateCondition(group.id, cond.id, { field: e.target.value })
                                  }
                                  className={cx(
                                    ui.input,
                                    "h-6 text-[10px] flex-1 min-w-0 bg-sky-900/30 border-sky-500/50 text-sky-100",
                                  )}
                                >
                                  {HEATMAP_FILTER_KEYS.map((f) => (
                                    <option key={f} value={f}>
                                      {f}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={cond.op}
                                  onChange={(e) =>
                                    updateCondition(group.id, cond.id, { op: e.target.value })
                                  }
                                  className={cx(
                                    ui.input,
                                    "h-6 text-[10px] flex-1 min-w-0 bg-emerald-900/30 border-emerald-500/50 text-emerald-100",
                                  )}
                                >
                                  {FILTER_OPERATIONS.map((op) => (
                                    <option key={op.value} value={op.value}>
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                                {noValue ? (
                                  <span className="text-[10px] text-[#595959] flex-1 min-w-0">
                                    (no value)
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={cond.value}
                                    onChange={(e) =>
                                      updateCondition(group.id, cond.id, { value: e.target.value })
                                    }
                                    placeholder="Value"
                                    className={cx(
                                      ui.input,
                                      "h-6 text-[10px] flex-1 min-w-0 bg-[#1a1a1a] text-[#d9d9d9]",
                                    )}
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
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} className={cx(ui.btnPrimary, "w-full h-9")}>
            📊 Generate Report
          </button>
        </div>
      </div>
    </div>
  );
});
