import React, { memo, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { HEATMAP_CELL_PX } from "../../utils/heatmap";
import { HeatmapFiltersEditor } from "./HeatmapFiltersEditor";
import { filtersConfigToFilterRoot, filterRootToFiltersConfig } from "./heatmapFilterPresets";

export const HeatMapView = memo(function HeatMapView({
  heatMapData,
  config,
  onCellClick,
  onZoomOut,
  onResetZoom,
  canZoomOut,
  canReset,
  zoomLevel = 0,
  zoomLevelLabel = "Full heatmap",
  isLoading = false,
  error = null,
  onRetry = null,
  onSaveBest = null,
  saveBestLabel = "Select for Stage 2",
  bestCandidates = [],
  onRemoveCandidate = null,
  onApplyFilters = null,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [activeTab, setActiveTab] = useState("heatmap");
  const [filterDraft, setFilterDraft] = useState(() => filtersConfigToFilterRoot(config?.filters));
  const [filterPresetDraft, setFilterPresetDraft] = useState(config?.filterPreset || "");

  useEffect(() => {
    setFilterDraft(filtersConfigToFilterRoot(config?.filters));
    setFilterPresetDraft(config?.filterPreset || "");
  }, [config?.filters, config?.filterPreset]);

  if (error) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
        <h3 className="text-[13px] font-semibold text-[#d9d9d9] mb-2">HeatMap</h3>
        <div className="py-6 text-center text-[12px] text-[#a6a6a6]">{error}</div>
        {onRetry && (
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={onRetry}
              className={cx(ui.btn, "text-[11px] px-3 py-1.5")}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
        <h3 className="text-[13px] font-semibold text-[#d9d9d9] mb-3">HeatMap</h3>
        <div className="text-[11px] text-[#8c8c8c] mb-2">Building heatmap…</div>
        <div
          className="aspect-square w-full max-w-full grid gap-1 rounded-lg overflow-hidden bg-[#1a1a1a]"
          style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(5, 1fr)" }}
        >
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="rounded-lg bg-[#252525] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!heatMapData || !heatMapData.cells) return null;

  const { cells, xKeys = [], yKeys = [] } = heatMapData;
  const gridW = heatMapData.W ?? cells[0]?.length ?? 1;
  const gridH = heatMapData.H ?? cells.length ?? 1;

  const handleApplyFilter = () => {
    onApplyFilters?.({
      filters: filterRootToFiltersConfig(filterDraft),
      filterPreset: filterPresetDraft || undefined,
    });
  };

  const renderCandidateList = () => {
    if (!Array.isArray(bestCandidates) || bestCandidates.length === 0) {
      return (
        <p className={cx("text-[12px] py-8 text-center", ui.textMuted)}>
          No favorite epochs yet. Open the Heatmap tab and click cells to mark candidates.
        </p>
      );
    }
    return (
      <div className="space-y-2 max-h-[min(520px,55vh)] overflow-y-auto pr-1">
        {bestCandidates.map((cand) => {
          const paramsStr =
            cand.params &&
            Object.entries(cand.params)
              .map(([k, v]) => {
                const [prefix, ...rest] = String(k).split(".");
                const name = rest.join(".") || prefix;
                const label = rest.length > 0 ? `${prefix} ${name}` : name;
                const val =
                  typeof v === "number" && Number.isFinite(v)
                    ? v % 1 === 0
                      ? v.toFixed(0)
                      : v.toFixed(2)
                    : v;
                return `${label}: ${val}`;
              })
              .join(", ");
          return (
            <div
              key={cand.id}
              className="border border-[#303030] rounded-lg px-3 py-2 text-[11px] text-[#d9d9d9] bg-[#111111]"
            >
              <div className="flex justify-between gap-2 items-center">
                <span className="font-mono text-emerald-300 text-[12px]">
                  {cand.score != null ? cand.score.toFixed(3) : "—"}
                </span>
                <span className="text-[#8c8c8c]">
                  ({cand.meta?.xi != null ? cand.meta.xi + 1 : "?"},{cand.meta?.yi != null ? cand.meta.yi + 1 : "?"})
                </span>
                {onRemoveCandidate && (
                  <button
                    type="button"
                    onClick={() => onRemoveCandidate(cand.id)}
                    className="text-red-400/90 hover:text-red-300 text-[12px] px-1"
                    aria-label="Remove candidate"
                  >
                    ×
                  </button>
                )}
              </div>
              {paramsStr && <div className="mt-1 text-[10px] text-[#a6a6a6]">{paramsStr}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  // Compute score range for coloring
  const scoredCells = cells
    .flat()
    .filter((c) => c && c.count > 0 && typeof c.avgScore === "number" && Number.isFinite(c.avgScore));
  const minScore = scoredCells.length ? Math.min(...scoredCells.map((c) => c.avgScore)) : 0;
  const maxScore = scoredCells.length ? Math.max(...scoredCells.map((c) => c.avgScore)) : 1;

  const lerp = (a, b, t) => a + (b - a) * t;
  const getCellColor = (avgScore) => {
    if (!scoredCells.length || !Number.isFinite(avgScore) || minScore === maxScore) {
      return "#14532d";
    }
    const t = Math.min(Math.max((avgScore - minScore) / (maxScore - minScore), 0), 1);
    // 0   -> red, 0.5 -> orange, 1 -> green
    const red = { r: 220, g: 38, b: 38 };
    const orange = { r: 249, g: 115, b: 22 };
    const green = { r: 22, g: 163, b: 74 };
    let from, to, localT;
    if (t <= 0.5) {
      from = red;
      to = orange;
      localT = t / 0.5;
    } else {
      from = orange;
      to = green;
      localT = (t - 0.5) / 0.5;
    }
    const r = Math.round(lerp(from.r, to.r, localT));
    const g = Math.round(lerp(from.g, to.g, localT));
    const b = Math.round(lerp(from.b, to.b, localT));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatParamValue = (v, rawKey) => {
    if (v == null) return "-";
    if (rawKey === "drawdown" && typeof v === "number" && v > 0 && v <= 1) {
      return `${(v * 100).toFixed(1)}%`;
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      if (rawKey === "profit_factor") return v.toFixed(2);
      return v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
    }
    return String(v);
  };

  const getIndicatorPrefixById = (indicatorId) => {
    const list = Array.isArray(config?.indicators) ? config.indicators : [];
    const ind = list.find((i) => String(i?.id) === String(indicatorId));
    return ind?.shortName || ind?.displayName || ind?.name || ind?.type || "";
  };

  const prettifyParamName = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    const lower = s.toLowerCase();
    const m = lower.match(/^(fast|slow|signal)(?:_|-)?period$/);
    if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)}Period`;
    if (lower === "stddev" || lower === "std_dev" || lower === "std-dev") return "StdDev";
    if (lower === "timeframe" || lower === "time_frame" || lower === "time-frame") return "TimeFrame";
    if (lower === "profit_factor") return "Profit factor";
    if (lower === "drawdown") return "Drawdown";

    // Fallback: split by _ or -, TitleCase each chunk
    const chunks = s.split(/[_-]+/g).filter(Boolean);
    const title = (w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w);
    const out = chunks.map((c) => title(String(c))).join("");
    return out || s;
  };

  const friendlyParamKey = (rawKey) => {
    const key = String(rawKey || "");
    const parts = key.split("_");
    if (parts.length >= 2 && /^\d+(\.\d+)?$/.test(parts[0])) {
      const indicatorId = parts[0];
      const paramRaw = parts.slice(1).join("_");
      const prefix = getIndicatorPrefixById(indicatorId);
      const name = prettifyParamName(paramRaw) || paramRaw;
      return prefix ? `${prefix}.${name}` : name;
    }
    if (key.includes(".")) return key;
    return prettifyParamName(key) || key;
  };

  const getCellParamLines = (cell, excludeRawKeys = null) => {
    const results = Array.isArray(cell?.results) ? cell.results : [];
    if (!results.length) return [];

    const byKey = new Map();
    for (const r of results) {
      const p = r?.params;
      if (!p || typeof p !== "object") continue;
      for (const [rawK, rawV] of Object.entries(p)) {
        if (excludeRawKeys && excludeRawKeys.has(rawK)) continue;
        const k = friendlyParamKey(rawK);
        if (!k) continue;
        if (!byKey.has(k)) byKey.set(k, { vals: [], rawKey: rawK });
        byKey.get(k).vals.push(rawV);
      }
    }
    const sortedKeys = [...byKey.keys()].sort((a, b) => String(a).localeCompare(String(b)));

    const lines = [];
    for (const k of sortedKeys) {
      const entry = byKey.get(k);
      const rawKey = entry?.rawKey;
      const vals = (entry?.vals || []).filter((v) => v != null);
      if (!vals.length) continue;

      const allNumeric = vals.every((v) => typeof v === "number" && Number.isFinite(v));
      if (allNumeric) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const value =
          cell.count > 1
            ? `${formatParamValue(min, rawKey)}–${formatParamValue(max, rawKey)}`
            : formatParamValue(vals[0], rawKey);
        lines.push({ key: k, value });
        continue;
      }

      const uniq = [...new Set(vals.map((v) => String(v)))];
      const value = cell.count > 1 ? uniq.slice(0, 4).join(", ") : uniq[0];
      lines.push({ key: k, value });
    }
    return lines;
  };

  const axisRawKeySet = new Set([...xKeys, ...yKeys]);
  const hoveredCellParamLinesOther = hoveredCell ? getCellParamLines(hoveredCell, axisRawKeySet) : [];

  const formatAxisRange = (min, max, rawKey) => {
    if (min == null || max == null || (typeof min === "number" && !Number.isFinite(min)) || (typeof max === "number" && !Number.isFinite(max))) {
      return "—";
    }
    if (min === max) return formatParamValue(min, rawKey);
    return `${formatParamValue(min, rawKey)}–${formatParamValue(max, rawKey)}`;
  };

  const axisRangeLines = (axisKeys, rangesMap) => {
    if (!axisKeys?.length) return [];
    return axisKeys.map((rawKey) => {
      const label = friendlyParamKey(rawKey);
      const r = rangesMap?.[rawKey];
      const value = r ? formatAxisRange(r.min, r.max, rawKey) : "—";
      return { label, value };
    });
  };

  const hoveredXAxisLines = hoveredCell ? axisRangeLines(xKeys, hoveredCell.paramRanges?.x) : [];
  const hoveredYAxisLines = hoveredCell ? axisRangeLines(yKeys, hoveredCell.paramRanges?.y) : [];

  const METRIC_FIELDS = [
    { keys: ["profit_factor"], label: "Profit factor", decimals: 2 },
    { keys: ["drawdown"], label: "Drawdown", decimals: 1, asPercent: true },
    { keys: ["mfe"], label: "MFE", decimals: 2 },
    { keys: ["mae"], label: "MAE", decimals: 2 },
    { keys: ["air"], label: "AIR", decimals: 1 },
    { keys: ["hitRate", "hit_rate"], label: "HitRate", decimals: 1 },
  ];

  const pickMetric = (row, keys) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  };

  const formatMetricVal = (n, decimals, asPercent = false) => {
    if (n == null || !Number.isFinite(n)) return "—";
    if (asPercent && n > 0 && n <= 1) return `${(n * 100).toFixed(decimals)}%`;
    return n.toFixed(decimals);
  };

  const hoveredMetricLines = (() => {
    if (!hoveredCell) return [];
    const results = Array.isArray(hoveredCell.results) ? hoveredCell.results : [];
    return METRIC_FIELDS.map(({ keys, label, decimals, asPercent }) => {
      const vals = results.map((r) => pickMetric(r, keys)).filter((v) => v != null);
      if (!vals.length) return { label, value: "—" };
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const value =
        min === max
          ? formatMetricVal(min, decimals, asPercent)
          : `${formatMetricVal(min, decimals, asPercent)}–${formatMetricVal(max, decimals, asPercent)}`;
      return { label, value };
    });
  })();

  const computeTooltipPosFromRect = (rect) => {
    const pad = 10;
    const tooltipW = 400;
    const tooltipH = 420;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    let left = rect.right + pad;
    let top = rect.top;

    if (left + tooltipW > vw - pad) left = Math.max(pad, rect.left - tooltipW - pad);
    if (top + tooltipH > vh - pad) top = Math.max(pad, vh - tooltipH - pad);
    if (top < pad) top = pad;

    return { left, top };
  };

  const handleCellEnter = (cell, e) => {
    if (!cell || cell.count === 0) return;
    setHoveredCell(cell);
    const rect = e?.currentTarget?.getBoundingClientRect?.();
    if (rect) setTooltipPos(computeTooltipPosFromRect(rect));
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setTooltipPos(null);
  };

  return (
    <div className={cx(ui.radius, ui.panelMuted, "p-3 w-fit max-w-full")}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
        <div className={cx("flex flex-wrap items-center gap-x-2", ui.textMuted)}>
          <span>Mock X params</span>
          <span>Mock Y params</span>
        </div>
        <span className="font-mono text-[#a6a6a6] shrink-0">AvgScore range: mock</span>
      </div>

      <div className="flex border-b border-[#303030] mb-2">
        <button type="button" onClick={() => setActiveTab("heatmap")} className={cx("px-3 py-1.5 text-[11px] font-medium border-b-2 -mb-px transition-colors", activeTab === "heatmap" ? "border-emerald-500 text-emerald-300" : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]")}>Heatmap</button>
        <button type="button" onClick={() => setActiveTab("favorites")} className={cx("px-3 py-1.5 text-[11px] font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5", activeTab === "favorites" ? "border-emerald-500 text-emerald-300" : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]")}>
          Favorite epochs
          {bestCandidates.length > 0 && <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] ml-1">{bestCandidates.length}</span>}
        </button>
      </div>

      <div className="grid">
        <div
          className={cx(
            "col-start-1 row-start-1 w-fit max-w-full",
            activeTab !== "heatmap" && "invisible pointer-events-none",
          )}
          aria-hidden={activeTab !== "heatmap"}
        >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 w-full">
        <div className="text-[11px] text-[#8c8c8c]">
          {zoomLevel === 0 ? "Level 0: Full heatmap" : `Level ${zoomLevel}: ${zoomLevelLabel}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={!canZoomOut}
            className={cx(
              "rounded-lg border border-[#303030] px-3 py-1.5 text-[11px] transition-colors",
              canZoomOut
                ? "bg-transparent text-[#d9d9d9] hover:bg-[#252525]"
                : "opacity-50 cursor-not-allowed text-[#8c8c8c]",
            )}
          >
            Zoom Out
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            disabled={!canReset}
            className={cx(
              "rounded-lg border border-[#303030] px-3 py-1.5 text-[11px] transition-colors",
              canReset
                ? "bg-transparent text-[#d9d9d9] hover:bg-[#252525]"
                : "opacity-50 cursor-not-allowed text-[#8c8c8c]",
            )}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="overflow-auto shrink-0">
          <div
            className="inline-grid gap-px w-fit"
            style={{
              gridTemplateColumns: `repeat(${gridW}, ${HEATMAP_CELL_PX}px)`,
              gridTemplateRows: `repeat(${gridH}, ${HEATMAP_CELL_PX}px)`,
            }}
          >
            {cells.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const empty = !cell || cell.count === 0;
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={cx(
                      "flex flex-col items-center justify-center rounded border font-mono text-[9px] leading-tight transition-[filter,border-color] overflow-hidden",
                      empty
                        ? "cursor-default border-white/[0.09] bg-[#111111]"
                        : "cursor-pointer border-white/10 hover:brightness-110 hover:border-white/20",
                    )}
                    style={
                      empty
                        ? { width: HEATMAP_CELL_PX, height: HEATMAP_CELL_PX }
                        : {
                            width: HEATMAP_CELL_PX,
                            height: HEATMAP_CELL_PX,
                            backgroundColor: getCellColor(cell.avgScore),
                          }
                    }
                    onMouseEnter={(e) => !empty && handleCellEnter(cell, e)}
                    onMouseLeave={handleCellLeave}
                    onClick={() => !empty && onCellClick?.(cell)}
                  >
                    {!empty && (
                      <>
                        <span className="leading-tight text-white/90">
                          {cell.avgScore != null ? cell.avgScore.toFixed(2) : "—"}
                        </span>
                        <span className="text-[9px] text-white/80 mt-0.5">n={cell.count}</span>
                      </>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch w-[340px] shrink-0 max-h-[min(480px,55vh)] overflow-x-hidden min-w-0">
          <HeatmapFiltersEditor
            filterRoot={filterDraft}
            onFilterRootChange={setFilterDraft}
            filterPreset={filterPresetDraft}
            onFilterPresetChange={setFilterPresetDraft}
            onApply={handleApplyFilter}
            applyLabel="Apply filter"
          />
        </div>

      </div>
        </div>

        <div
          className={cx(
            "col-start-1 row-start-1 flex flex-col gap-3 w-full min-h-0",
            activeTab !== "favorites" && "invisible pointer-events-none",
          )}
          aria-hidden={activeTab !== "favorites"}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 w-full min-h-[28px] invisible" aria-hidden>
            <div className="text-[11px] text-[#8c8c8c]">Level 0: Full heatmap</div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-transparent px-3 py-1.5 text-[11px]">Zoom Out</span>
              <span className="rounded-lg border border-transparent px-3 py-1.5 text-[11px]">Reset</span>
            </div>
          </div>
          <div className="text-[11px] text-[#8c8c8c]">
            Cells marked from the heatmap. Confirm selection to use them in the next stage.
          </div>
          <button
            type="button"
            onClick={onSaveBest || undefined}
            disabled={!onSaveBest || bestCandidates.length === 0}
            className={cx(
              ui.btnPrimary,
              "h-9 px-4 text-[12px] self-start shrink-0",
              (!onSaveBest || bestCandidates.length === 0) && "opacity-50 cursor-not-allowed",
            )}
          >
            {saveBestLabel}
          </button>
          <div className="flex items-start gap-3 min-h-0 flex-1 min-w-0">
            <div className="flex-1 min-w-0 min-h-[min(480px,55vh)] overflow-y-auto overflow-x-hidden">
              {renderCandidateList()}
            </div>
            <div className="w-[340px] shrink-0 invisible pointer-events-none" aria-hidden />
          </div>
        </div>
      </div>


      {hoveredCell && tooltipPos && (
        <div
          className="fixed z-[60] text-left text-[11px] text-[#d9d9d9] max-h-[85vh] overflow-y-auto"
          style={{ left: tooltipPos.left, top: tooltipPos.top, width: 400 }}
        >
          <div className="rounded-lg border border-[#303030] bg-[#141414] shadow-xl p-3 space-y-2">
            <div className="font-medium text-[#f0f0f0]">Cell details</div>
            <div>
              avgScore:{" "}
              <span className="text-emerald-400 font-mono">
                {hoveredCell.avgScore != null ? hoveredCell.avgScore.toFixed(3) : "-"}
              </span>
            </div>
            <div>
              min..max:{" "}
              <span className="font-mono">
                {hoveredCell.minScore != null ? hoveredCell.minScore.toFixed(3) : "-"}..
                {hoveredCell.maxScore != null ? hoveredCell.maxScore.toFixed(3) : "-"}
              </span>
            </div>
            <div>
              count: <span className="text-emerald-400">{hoveredCell.count}</span>
            </div>

            <div className="pt-1 border-t border-[#303030] mt-1">
              <div className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wide mb-0.5">Epochs</div>
              <div className="font-mono text-[#d9d9d9] text-[10px]">1–5</div>
            </div>

            <div className="pt-1 border-t border-[#303030] mt-1">
              <div className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wide mb-1">Indicator Ranges</div>
              <div className="rounded border border-[#303030] bg-[#111111] p-2 font-mono text-[10px] text-[#d9d9d9] leading-relaxed whitespace-pre-wrap">
                <div className="text-[#a6a6a6] mb-1">X Axis:</div>
                {hoveredXAxisLines.length === 0 ? (
                  <div className="text-[#595959] pl-2">—</div>
                ) : (
                  hoveredXAxisLines.map((line) => (
                    <div key={`x-${line.label}`} className="pl-2">
                      {line.label}: {line.value}
                    </div>
                  ))
                )}
                <div className="text-[#a6a6a6] mt-2 mb-1">Y Axis:</div>
                {hoveredYAxisLines.length === 0 ? (
                  <div className="text-[#595959] pl-2">—</div>
                ) : (
                  hoveredYAxisLines.map((line) => (
                    <div key={`y-${line.label}`} className="pl-2">
                      {line.label}: {line.value}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-1 border-t border-[#303030] mt-1">
              <div className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wide mb-1">Metrics</div>
              <div className="rounded border border-[#303030] bg-[#111111] p-2 font-mono text-[10px] text-[#d9d9d9] space-y-0.5">
                {hoveredMetricLines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-3">
                    <span className="text-[#a6a6a6]">{line.label}:</span>
                    <span className="text-emerald-300/90 tabular-nums">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {hoveredCellParamLinesOther.length > 0 && (
              <div className="pt-1 border-t border-[#303030] mt-1">
                <div className="text-[10px] text-[#8c8c8c] mb-1">Other parameters</div>
                <div className="max-h-32 overflow-y-auto border border-[#303030] rounded bg-[#111111] p-2 space-y-1">
                  {hoveredCellParamLinesOther.map((line) => (
                    <div key={line.key} className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[#d9d9d9] break-all text-[10px]">{line.key}</span>
                      <span className="font-mono text-emerald-300 whitespace-nowrap text-[10px]">{line.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[#8c8c8c]">
        Mock HeatMap view; click cell to drill down (when wired).
      </p>
    </div>
  );
});
