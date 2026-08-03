import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "../../constants/heatmap";
import { BASE_INDICATORS } from "../../constants/indicators";
import {
  DEFAULT_RISK_HEATMAP_AXES,
  RISK_HEATMAP_METRICS,
  riskLossStreakMidpoints,
  riskStoplossMidpoints,
} from "../../constants/risk";
import { getParamLabel } from "../../utils/indicators";
import { genId, FILTER_PRESET_BUILTIN, cloneFilterRootWithNewIds } from "./heatmapFilterPresets";
import { getBbHeatmapAxisKeys } from "../../features/builder/utils/defaultBbSetup";
import { AppSelect } from "../common/AppSelect";
import { AppInput } from "../common/AppInput";
import { AppButton } from "../common/AppButton";

const FILTER_FIELD_OPTIONS = HEATMAP_FILTER_KEYS.map((f) => ({ value: f, label: f }));
const FILTER_OP_OPTIONS = FILTER_OPERATIONS.map((op) => ({ value: op.value, label: op.label }));

const FiltersSection = memo(function FiltersSection({
  filterRoot,
  filterPreset,
  customPresets,
  setRootLogic,
  addGroup,
  removeGroup,
  setGroupLogic,
  addCondition,
  removeCondition,
  updateCondition,
  handlePresetChange,
  handleSaveFilterAs,
}) {
  return (
    <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
      <div className={cx("text-[11px] font-medium text-[#d9d9d9] mb-3")}>Filters</div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className={cx("text-[10px]", ui.textMuted)}>Filter Preset</label>
          <AppSelect
            value={filterPreset || ""}
            onValueChange={handlePresetChange}
            options={[
              { value: "", label: "—" },
              ...Object.keys(FILTER_PRESET_BUILTIN).map((key) => ({ value: key, label: key })),
              ...customPresets.map((p) => ({ value: p.name, label: p.name })),
            ]}
            className="min-w-[160px]"
            triggerClassName="h-8 text-[11px]"
          />
          <AppButton type="button" onClick={handleSaveFilterAs} variant="outline" className="h-8 px-3 text-[11px]">
            Save filter as
          </AppButton>
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
                      <AppSelect
                        value={cond.field}
                        onValueChange={(field) => updateCondition(group.id, cond.id, { field })}
                        options={FILTER_FIELD_OPTIONS}
                        className="flex-1 min-w-0"
                        triggerClassName="h-6 text-[10px] bg-sky-900/30 border-sky-500/50 text-sky-100"
                      />
                      <AppSelect
                        value={cond.op}
                        onValueChange={(op) => updateCondition(group.id, cond.id, { op })}
                        options={FILTER_OP_OPTIONS}
                        className="flex-1 min-w-0"
                        triggerClassName="h-6 text-[10px] bg-emerald-900/30 border-emerald-500/50 text-emerald-100"
                      />
                      {noValue ? (
                        <span className="text-[10px] text-[#595959] flex-1 min-w-0">(no value)</span>
                      ) : (
                        <AppInput
                          type="text"
                          value={cond.value}
                          onChange={(e) => updateCondition(group.id, cond.id, { value: e.target.value })}
                          placeholder="Value"
                          wrapperClassName="flex-1 min-w-0"
                          className="h-6 text-[10px] bg-[#1a1a1a] text-[#d9d9d9]"
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
  );
});

export const HeatMapConfigurator = memo(function HeatMapConfigurator({
  indicators = [],
  onGenerate,
  variant = "indicators",
  riskStoplossRanges,
  riskHyperoptParams,
}) {
  const isRisk = variant === "risk";

  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState([]);
  const [xAxisKeys, setXAxisKeys] = useState(() =>
    isRisk ? [DEFAULT_RISK_HEATMAP_AXES.x] : [],
  );
  const [yAxisKeys, setYAxisKeys] = useState(() =>
    isRisk ? [DEFAULT_RISK_HEATMAP_AXES.y] : [],
  );
  const [fixedParams, setFixedParams] = useState({});
  const [filterRoot, setFilterRoot] = useState(() => ({
    rootLogic: "or",
    groups: [{ id: genId(), logic: "and", conditions: [] }],
  }));
  const [filterPreset, setFilterPreset] = useState(() => (isRisk ? "" : "Super filter"));
  const [customPresets, setCustomPresets] = useState([]);

  useEffect(() => {
    if (isRisk) return;
    const builtin = FILTER_PRESET_BUILTIN["Super filter"];
    if (builtin) setFilterRoot(builtin());
  }, [isRisk]);

  const selectedIndicators = useMemo(
    () => indicators.filter((ind) => selectedIndicatorIds.includes(ind.id)),
    [indicators, selectedIndicatorIds],
  );

  const availableParams = useMemo(() => {
    if (isRisk || selectedIndicators.length === 0) return [];
    const out = [];
    selectedIndicators.forEach((ind) => {
      const baseDef = BASE_INDICATORS[ind.type];
      const baseParams = baseDef?.params ?? [];
      const userParams = Array.isArray(ind.params) ? ind.params : [];
      const paramByKey = {};
      userParams.forEach((p) => {
        paramByKey[p.key] = p;
      });
      baseParams.forEach((baseParam) => {
        const param = { ...baseParam, ...paramByKey[baseParam.key] };
        const compositeKey = `${ind.id}_${param.key}`;
        out.push({
          ...param,
          compositeKey,
          label: getParamLabel(ind, param),
          indicatorId: ind.id,
        });
      });
    });
    return out;
  }, [selectedIndicators, isRisk]);

  const axisOptions = isRisk ? RISK_HEATMAP_METRICS : availableParams;
  const axisKeyField = isRisk ? "key" : "compositeKey";

  const remainingParams = useMemo(() => {
    if (isRisk) return [];
    return availableParams.filter(
      (p) => !xAxisKeys.includes(p.compositeKey) && !yAxisKeys.includes(p.compositeKey),
    );
  }, [availableParams, xAxisKeys, yAxisKeys, isRisk]);

  useEffect(() => {
    if (isRisk || indicators.length === 0) return;
    const bb = indicators.find((ind) => ind.type === "BBANDS") ?? indicators[0];
    if (selectedIndicatorIds.length === 0) {
      setSelectedIndicatorIds([bb.id]);
    }
    if (bb.type === "BBANDS" && xAxisKeys.length === 0 && yAxisKeys.length === 0) {
      const { xAxis, yAxis } = getBbHeatmapAxisKeys(bb.id);
      setXAxisKeys(xAxis);
      setYAxisKeys(yAxis);
    }
  }, [indicators, isRisk, selectedIndicatorIds.length, xAxisKeys.length, yAxisKeys.length]);

  const remainingKeys = useMemo(
    () => remainingParams.map((p) => p.compositeKey).sort().join(","),
    [remainingParams],
  );

  useEffect(() => {
    if (isRisk) return;
    const next = {};
    remainingParams.forEach((p) => {
      next[p.compositeKey] = p.default;
    });
    setFixedParams((prev) => ({ ...next, ...prev }));
  }, [remainingKeys, isRisk, remainingParams]);

  useEffect(() => {
    if (!isRisk || !riskStoplossRanges) return;
    setFixedParams({
      ...riskStoplossMidpoints(riskStoplossRanges),
      ...riskLossStreakMidpoints(riskHyperoptParams),
    });
  }, [isRisk, riskStoplossRanges, riskHyperoptParams]);

  const toggleIndicator = useCallback((id) => {
    setSelectedIndicatorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setXAxisKeys([]);
    setYAxisKeys([]);
    setFixedParams({});
  }, []);

  const selectXAxis = useCallback(
    (key) => {
      setXAxisKeys([key]);
      setYAxisKeys((prev) => prev.filter((k) => k !== key));
    },
    [],
  );

  const selectYAxis = useCallback(
    (key) => {
      setYAxisKeys([key]);
      setXAxisKeys((prev) => prev.filter((k) => k !== key));
    },
    [],
  );

  const toggleXAxis = useCallback(
    (key) => {
      if (isRisk) {
        selectXAxis(key);
        return;
      }
      setXAxisKeys((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        return next;
      });
      setYAxisKeys((prev) => prev.filter((k) => k !== key));
    },
    [isRisk, selectXAxis],
  );

  const toggleYAxis = useCallback(
    (key) => {
      if (isRisk) {
        selectYAxis(key);
        return;
      }
      setYAxisKeys((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        return next;
      });
      setXAxisKeys((prev) => prev.filter((k) => k !== key));
    },
    [isRisk, selectYAxis],
  );

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
          : g,
      ),
    }));
  }, []);
  const removeCondition = useCallback((groupId, conditionId) => {
    setFilterRoot((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) } : g,
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
              conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, ...patch } : c)),
            }
          : g,
      ),
    }));
  }, []);

  const applyFilterPreset = useCallback(
    (presetKey) => {
      if (!presetKey) return;
      const builtin = FILTER_PRESET_BUILTIN[presetKey];
      if (builtin) {
        setFilterRoot(builtin());
        return;
      }
      const custom = customPresets.find((p) => p.name === presetKey);
      if (custom) setFilterRoot(cloneFilterRootWithNewIds(custom.filter));
    },
    [customPresets],
  );

  const handlePresetChange = useCallback(
    (value) => {
      setFilterPreset(value);
      applyFilterPreset(value);
    },
    [applyFilterPreset],
  );

  const handleSaveFilterAs = useCallback(() => {
    const name = window.prompt("Enter preset name");
    if (!name || !name.trim()) return;
    setCustomPresets((prev) => [
      ...prev,
      { id: genId(), name: name.trim(), filter: cloneFilterRootWithNewIds(filterRoot) },
    ]);
    setFilterPreset(name.trim());
  }, [filterRoot]);

  const buildFiltersConfig = () => ({
    logic: filterRoot.rootLogic,
    groups: filterRoot.groups.map((g) => ({
      logic: g.logic,
      conditions: g.conditions.map((c) => ({ field: c.field, op: c.op, value: c.value })),
    })),
  });

  const handleGenerate = () => {
    if (isRisk) {
      if (xAxisKeys.length === 0 || yAxisKeys.length === 0) {
        alert("Select one metric for X axis and one for Y axis");
        return;
      }
      const config = {
        heatmapVariant: "risk",
        indicators: [],
        xAxis: xAxisKeys,
        yAxis: yAxisKeys,
        fixedParams: {
          ...(riskStoplossRanges ? riskStoplossMidpoints(riskStoplossRanges) : fixedParams),
          ...riskLossStreakMidpoints(riskHyperoptParams),
        },
        filters: buildFiltersConfig(),
        filterPreset: filterPreset || undefined,
      };
      onGenerate?.(config);
      return;
    }

    if (selectedIndicators.length === 0 || xAxisKeys.length === 0 || yAxisKeys.length === 0) {
      alert("Select at least one indicator, one X axis parameter, and one Y axis parameter");
      return;
    }
    const config = {
      indicators: selectedIndicators,
      xAxis: xAxisKeys,
      yAxis: yAxisKeys,
      fixedParams,
      filters: buildFiltersConfig(),
      filterPreset: filterPreset || undefined,
    };
    onGenerate?.(config);
  };

  if (!isRisk && indicators.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4 text-center text-[12px]", ui.textMuted)}>
        Add indicators first to configure results
      </div>
    );
  }

  const showAxisSection = isRisk || (selectedIndicators.length > 0 && availableParams.length > 0);

  const getAxisLabel = (p) => (isRisk ? p.label : p.label);
  const getAxisKey = (p) => p[axisKeyField];

  const renderAxisDropdown = (axis, selectedKeys, otherKeys, onToggle) => (
    <div>
      <label className={cx("block mb-1 text-xs", ui.textMuted)}>
        {axis} Axis {isRisk ? "Metric" : "Parameter"}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
          >
            <span className={cx("truncate", !selectedKeys.length && "text-[#595959]")}>
              {selectedKeys.length
                ? axisOptions
                    .filter((p) => selectedKeys.includes(getAxisKey(p)))
                    .map((p) => getAxisLabel(p))
                    .join(", ")
                : isRisk
                  ? "Select metric..."
                  : "Select parameters..."}
            </span>
            <span className="text-[10px] shrink-0">▼</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] max-h-64 gap-0 overflow-y-auto p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {axisOptions.map((p) => {
            const key = getAxisKey(p);
            const inOther = otherKeys.includes(key);
            const checked = selectedKeys.includes(key);
            return (
              <label
                key={key}
                className={cx(
                  "flex items-center gap-2 border-0 border-b border-[#303030] px-3 py-2 last:border-0",
                  inOther ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#252525]",
                )}
              >
                {isRisk ? (
                  <input
                    type="radio"
                    name={`heatmap-axis-${axis}`}
                    checked={checked}
                    disabled={inOther}
                    onChange={() => !inOther && onToggle(key)}
                    className="h-3.5 w-3.5"
                  />
                ) : (
                  <Checkbox
                    checked={checked}
                    disabled={inOther}
                    onCheckedChange={() => !inOther && onToggle(key)}
                    className="size-3.5 border-[#505050]"
                  />
                )}
                <span className="text-[11px] text-[#d9d9d9]">{getAxisLabel(p)}</span>
              </label>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="text-[12px] font-medium text-[#d9d9d9]">Result Builder</div>
        <div className={cx("text-[11px]", ui.textMuted)}>
          {isRisk
            ? "HeatMap axes: Profit factor and Drawdown (Risk stage)"
            : "Configure HeatMap or Generate Report"}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isRisk && (
          <div className={cx("text-[11px]", ui.textMuted)}>
            Choose which metric maps to each axis. Stoploss parameters are held fixed at the midpoint of
            your Risk ranges.
          </div>
        )}

        {!isRisk && (
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Select Indicator</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
                >
                  <span className={cx("truncate", !selectedIndicatorIds.length && "text-[#595959]")}>
                    {selectedIndicatorIds.length
                      ? indicators
                          .filter((ind) => selectedIndicatorIds.includes(ind.id))
                          .map((ind) => ind.name)
                          .join(", ")
                      : "Select indicators..."}
                  </span>
                  <span className="text-[10px] shrink-0">▼</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] max-h-64 gap-0 overflow-y-auto p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {indicators.map((ind) => {
                  const checked = selectedIndicatorIds.includes(ind.id);
                  return (
                    <label
                      key={ind.id}
                      className="flex cursor-pointer items-center gap-2 border-0 border-b border-[#303030] px-3 py-2 last:border-0 hover:bg-[#252525]"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleIndicator(ind.id)}
                        className="size-3.5 border-[#505050]"
                      />
                      <span className="text-[11px] text-[#d9d9d9]">{ind.name}</span>
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        )}

        {showAxisSection && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {renderAxisDropdown("X", xAxisKeys, yAxisKeys, toggleXAxis)}
              {renderAxisDropdown("Y", yAxisKeys, xAxisKeys, toggleYAxis)}
            </div>

            <FiltersSection
              filterRoot={filterRoot}
              filterPreset={filterPreset}
              customPresets={customPresets}
              setRootLogic={setRootLogic}
              addGroup={addGroup}
              removeGroup={removeGroup}
              setGroupLogic={setGroupLogic}
              addCondition={addCondition}
              removeCondition={removeCondition}
              updateCondition={updateCondition}
              handlePresetChange={handlePresetChange}
              handleSaveFilterAs={handleSaveFilterAs}
            />

            <AppButton type="button" onClick={handleGenerate} variant="default" className="w-full h-9">
              🎨 Generate HeatMap
            </AppButton>
          </>
        )}
      </div>
    </div>
  );
});


