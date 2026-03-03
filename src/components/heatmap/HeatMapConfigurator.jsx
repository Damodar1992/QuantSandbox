import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "../../constants/heatmap";
import { BASE_INDICATORS } from "../../constants/indicators";
import { getParamLabel } from "../../utils/indicators";
import { genId, FILTER_PRESET_BUILTIN, cloneFilterRootWithNewIds } from "./heatmapFilterPresets";

export const HeatMapConfigurator = memo(({ indicators, onGenerate }) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState([]);
  const [xAxisKeys, setXAxisKeys] = useState([]);
  const [yAxisKeys, setYAxisKeys] = useState([]);
  const [fixedParams, setFixedParams] = useState({});
  const [filterRoot, setFilterRoot] = useState(() => ({
    rootLogic: "or",
    groups: [{ id: genId(), logic: "and", conditions: [] }],
  }));
  const [filterPreset, setFilterPreset] = useState("");
  const [customPresets, setCustomPresets] = useState([]);
  const [openIndicatorDropdown, setOpenIndicatorDropdown] = useState(false);
  const [openXDropdown, setOpenXDropdown] = useState(false);
  const [openYDropdown, setOpenYDropdown] = useState(false);
  const indicatorDropdownRef = useOutsideClose(openIndicatorDropdown, () => setOpenIndicatorDropdown(false));
  const xDropdownRef = useOutsideClose(openXDropdown, () => setOpenXDropdown(false));
  const yDropdownRef = useOutsideClose(openYDropdown, () => setOpenYDropdown(false));

  const selectedIndicators = useMemo(() =>
    indicators.filter(ind => selectedIndicatorIds.includes(ind.id)),
    [indicators, selectedIndicatorIds]
  );

  const availableParams = useMemo(() => {
    if (selectedIndicators.length === 0) return [];
    const out = [];
    selectedIndicators.forEach(ind => {
      const baseDef = BASE_INDICATORS[ind.type];
      const baseParams = baseDef?.params ?? [];
      const userParams = Array.isArray(ind.params) ? ind.params : [];
      const paramByKey = {};
      userParams.forEach(p => { paramByKey[p.key] = p; });
      baseParams.forEach(baseParam => {
        const param = { ...baseParam, ...paramByKey[baseParam.key] };
        const compositeKey = `${ind.id}_${param.key}`;
        out.push({
          ...param,
          compositeKey,
          label: getParamLabel(ind, param),
          indicatorId: ind.id
        });
      });
    });
    return out;
  }, [selectedIndicators]);

  const remainingParams = useMemo(() => {
    return availableParams.filter(p => !xAxisKeys.includes(p.compositeKey) && !yAxisKeys.includes(p.compositeKey));
  }, [availableParams, xAxisKeys, yAxisKeys]);

  const getParamValues = useCallback((param) => {
    const values = [];
    for (let val = param.min; val <= param.max; val += param.step) {
      values.push(val);
    }
    return values;
  }, []);

  useEffect(() => {
    if (indicators.length > 0 && selectedIndicatorIds.length === 0) {
      setSelectedIndicatorIds([indicators[0].id]);
    }
  }, [indicators]);

  const remainingKeys = useMemo(() => remainingParams.map(p => p.compositeKey).sort().join(","), [remainingParams]);
  useEffect(() => {
    const next = {};
    remainingParams.forEach(p => {
      next[p.compositeKey] = p.default;
    });
    setFixedParams(prev => ({ ...next, ...prev }));
  }, [remainingKeys]);

  const toggleIndicator = useCallback((id) => {
    setSelectedIndicatorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setXAxisKeys([]);
    setYAxisKeys([]);
    setFixedParams({});
  }, []);

  const toggleXAxis = useCallback((compositeKey) => {
    setXAxisKeys(prev => {
      const next = prev.includes(compositeKey) ? prev.filter(k => k !== compositeKey) : [...prev, compositeKey];
      return next;
    });
    setYAxisKeys(prev => prev.filter(k => k !== compositeKey));
  }, []);

  const toggleYAxis = useCallback((compositeKey) => {
    setYAxisKeys(prev => {
      const next = prev.includes(compositeKey) ? prev.filter(k => k !== compositeKey) : [...prev, compositeKey];
      return next;
    });
    setXAxisKeys(prev => prev.filter(k => k !== compositeKey));
  }, []);

  const setRootLogic = useCallback((logic) => {
    setFilterRoot((prev) => ({ ...prev, rootLogic: logic }));
  }, []);
  const addGroup = useCallback(() => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: [...prev.groups, { id: genId(), logic: "and", conditions: [] }],
    }));
  }, []);
  const removeGroup = useCallback((groupId) => {
    setFilterRoot((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== groupId) }));
  }, []);
  const setGroupLogic = useCallback((groupId, logic) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, logic } : g)),
    }));
  }, []);
  const addCondition = useCallback((groupId) => {
    const firstField = HEATMAP_FILTER_KEYS[0];
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, { id: genId(), field: firstField, op: "EQ", value: "" }] }
          : g
      ),
    }));
  }, []);
  const removeCondition = useCallback((groupId, conditionId) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g
      ),
    }));
  }, []);
  const updateCondition = useCallback((groupId, conditionId, patch) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...patch } : c
              ),
            }
          : g
      ),
    }));
  }, []);

  const applyFilterPreset = useCallback((presetKey) => {
    if (!presetKey) return;
    const builtin = FILTER_PRESET_BUILTIN[presetKey];
    if (builtin) {
      setFilterRoot(builtin());
      return;
    }
    const custom = customPresets.find((p) => p.name === presetKey);
    if (custom) setFilterRoot(cloneFilterRootWithNewIds(custom.filter));
  }, [customPresets]);

  const handlePresetChange = useCallback((e) => {
    const value = e.target.value;
    setFilterPreset(value);
    applyFilterPreset(value);
  }, [applyFilterPreset]);

  const handleSaveFilterAs = useCallback(() => {
    const name = window.prompt("Enter preset name");
    if (!name || !name.trim()) return;
    setCustomPresets((prev) => [...prev, { id: genId(), name: name.trim(), filter: cloneFilterRootWithNewIds(filterRoot) }]);
    setFilterPreset(name.trim());
  }, [filterRoot]);

  const handleGenerate = () => {
    if (selectedIndicators.length === 0 || xAxisKeys.length === 0 || yAxisKeys.length === 0) {
      alert("Select at least one indicator, one X axis parameter, and one Y axis parameter");
      return;
    }
    const filters = {
      logic: filterRoot.rootLogic,
      groups: filterRoot.groups.map((g) => ({
        logic: g.logic,
        conditions: g.conditions.map((c) => ({ field: c.field, op: c.op, value: c.value })),
      })),
    };
    const config = {
      indicators: selectedIndicators,
      xAxis: xAxisKeys,
      yAxis: yAxisKeys,
      fixedParams,
      filters,
    };
    if (typeof onGenerate === "function") {
      onGenerate(config);
    }
  };

  if (indicators.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4 text-center text-[12px]", ui.textMuted)}>
        Add indicators first to configure results
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="text-[12px] font-medium text-[#d9d9d9]">Result Builder</div>
        <div className={cx("text-[11px]", ui.textMuted)}>Configure HeatMap or Generate Report</div>
      </div>

      <div className="p-4 space-y-4">
        <div ref={indicatorDropdownRef} className="relative">
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Select Indicator</label>
          <button
            type="button"
            onClick={() => setOpenIndicatorDropdown(v => !v)}
            className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
          >
            <span className={cx("truncate", !selectedIndicatorIds.length && "text-[#595959]")}>
              {selectedIndicatorIds.length
                ? indicators.filter(ind => selectedIndicatorIds.includes(ind.id)).map(ind => ind.name).join(", ")
                : "Select indicators..."}
            </span>
            <span className="text-[10px] shrink-0">{openIndicatorDropdown ? "▲" : "▼"}</span>
          </button>
          {openIndicatorDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-[#303030] bg-[#1a1a1a] shadow-lg max-h-64 overflow-y-auto">
              {indicators.map(ind => (
                <label key={ind.id} className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#252525] border-0 border-b border-[#303030] last:border-0">
                  <input
                    type="checkbox"
                    checked={selectedIndicatorIds.includes(ind.id)}
                    onChange={() => toggleIndicator(ind.id)}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-[#d9d9d9]">{ind.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedIndicators.length > 0 && availableParams.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div ref={xDropdownRef} className="relative">
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>X Axis Parameter</label>
                <button
                  type="button"
                  onClick={() => setOpenXDropdown(v => !v)}
                  className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
                >
                  <span className={cx("truncate", !xAxisKeys.length && "text-[#595959]")}>
                    {xAxisKeys.length
                      ? availableParams.filter(p => xAxisKeys.includes(p.compositeKey)).map(p => p.label).join(", ")
                      : "Select parameters..."}
                  </span>
                  <span className="text-[10px] shrink-0">{openXDropdown ? "▲" : "▼"}</span>
                </button>
                {openXDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[#303030] bg-[#1a1a1a] shadow-lg max-h-64 overflow-y-auto">
                    {availableParams.map(p => {
                      const inY = yAxisKeys.includes(p.compositeKey);
                      return (
                        <label key={p.compositeKey} className={cx("flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#252525] border-0 border-b border-[#303030] last:border-0", inY && "opacity-50 cursor-not-allowed")}>
                          <input
                            type="checkbox"
                            checked={xAxisKeys.includes(p.compositeKey)}
                            disabled={inY}
                            onChange={() => !inY && toggleXAxis(p.compositeKey)}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-[#d9d9d9]">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div ref={yDropdownRef} className="relative">
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Y Axis Parameter</label>
                <button
                  type="button"
                  onClick={() => setOpenYDropdown(v => !v)}
                  className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
                >
                  <span className={cx("truncate", !yAxisKeys.length && "text-[#595959]")}>
                    {yAxisKeys.length
                      ? availableParams.filter(p => yAxisKeys.includes(p.compositeKey)).map(p => p.label).join(", ")
                      : "Select parameters..."}
                  </span>
                  <span className="text-[10px] shrink-0">{openYDropdown ? "▲" : "▼"}</span>
                </button>
                {openYDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[#303030] bg-[#1a1a1a] shadow-lg max-h-64 overflow-y-auto">
                    {availableParams.map(p => {
                      const inX = xAxisKeys.includes(p.compositeKey);
                      return (
                        <label key={p.compositeKey} className={cx("flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#252525] border-0 border-b border-[#303030] last:border-0", inX && "opacity-50 cursor-not-allowed")}>
                          <input
                            type="checkbox"
                            checked={yAxisKeys.includes(p.compositeKey)}
                            disabled={inX}
                            onChange={() => !inX && toggleYAxis(p.compositeKey)}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-[#d9d9d9]">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {remainingParams.length > 0 && (
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className={cx("text-[11px] font-medium text-[#d9d9d9] mb-3")}>
                  Fixed Parameters
                </div>
                <div className={cx("text-[10px]", ui.textMuted, "mb-2")}>
                  Select values for parameters not used in X/Y axes
                </div>
                <div className="space-y-2">
                  {remainingParams.map(param => {
                    const possibleValues = getParamValues(param);
                    return (
                      <div key={param.compositeKey}>
                        <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>
                          {param.label}
                        </label>
                        <select
                          value={fixedParams[param.compositeKey] ?? param.default}
                          onChange={(e) => setFixedParams(prev => ({
                            ...prev,
                            [param.compositeKey]: parseFloat(e.target.value)
                          }))}
                          className={cx(ui.input, "h-8 text-[11px]")}
                        >
                          {possibleValues.map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
              <div className={cx("text-[11px] font-medium text-[#d9d9d9] mb-3")}>Filters</div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className={cx("text-[10px]", ui.textMuted)}>Filter Preset</label>
                  <select
                    value={filterPreset}
                    onChange={handlePresetChange}
                    className={cx(ui.input, "h-8 text-[11px] min-w-[160px]")}
                  >
                    <option value="">—</option>
                    {Object.keys(FILTER_PRESET_BUILTIN).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                    {customPresets.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveFilterAs}
                    className={cx(ui.btn, "h-8 px-3 text-[11px]")}
                  >
                    Save filter as
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-md overflow-hidden border border-[#303030]">
                    <button
                      type="button"
                      onClick={() => setRootLogic("and")}
                      className={cx("px-3 py-1.5 text-[11px] font-medium", filterRoot.rootLogic === "and" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]")}
                    >
                      And
                    </button>
                    <button
                      type="button"
                      onClick={() => setRootLogic("or")}
                      className={cx("px-3 py-1.5 text-[11px] font-medium", filterRoot.rootLogic === "or" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]")}
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
                  <div key={group.id} className="rounded-lg border border-[#303030] bg-[#141414] overflow-hidden border-l-4 border-l-sky-500/50">
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
                          className={cx("px-2 py-1 text-[10px] font-medium", group.logic === "and" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]")}
                        >
                          And
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupLogic(group.id, "or")}
                          className={cx("px-2 py-1 text-[10px] font-medium", group.logic === "or" ? "bg-rose-600/80 text-white" : "bg-[#1a1a1a] text-[#8c8c8c] hover:bg-[#252525]")}
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
                        <div className="text-[10px] text-[#595959] py-2 px-3">No conditions. Add a condition above.</div>
                      ) : (
                        group.conditions.map((cond) => {
                          const noValue = cond.op === "IS_NULL" || cond.op === "IS_NOT_NULL";
                          return (
                            <div key={cond.id} className="flex flex-nowrap items-center gap-1.5 py-1.5 px-2 rounded border border-[#303030]/50 bg-[#0f0f0f] min-w-0">
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
                                className={cx(ui.input, "h-6 text-[10px] flex-1 min-w-0 bg-sky-900/30 border-sky-500/50 text-sky-100")}
                              >
                                {HEATMAP_FILTER_KEYS.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                              <select
                                value={cond.op}
                                onChange={(e) => updateCondition(group.id, cond.id, { op: e.target.value })}
                                className={cx(ui.input, "h-6 text-[10px] flex-1 min-w-0 bg-emerald-900/30 border-emerald-500/50 text-emerald-100")}
                              >
                                {FILTER_OPERATIONS.map((op) => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>
                              {noValue ? (
                                <span className="text-[10px] text-[#595959] flex-1 min-w-0">(no value)</span>
                              ) : (
                                <input
                                  type="text"
                                  value={cond.value}
                                  onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                                  placeholder="Value"
                                  className={cx(ui.input, "h-6 text-[10px] flex-1 min-w-0 bg-[#1a1a1a] text-[#d9d9d9]")}
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

            <button type="button" onClick={handleGenerate} className={cx(ui.btnPrimary, "w-full h-9")}>
              🎨 Generate HeatMap
            </button>
          </>
        )}
      </div>
    </div>
  );
});
