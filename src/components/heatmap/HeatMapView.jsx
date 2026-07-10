import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../../constants/ui";
import { HEATMAP_CELL_PX, HEATMAP_LEGEND_STOPS } from "../../utils/heatmap";
import { TrashIcon } from "../shared";
import { AppButton } from "../common/AppButton";
import { filtersConfigToFilterRoot } from "./heatmapFilterPresets";
import { HeatmapFiltersEditor } from "./HeatmapFiltersEditor";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countAppliedFilters(filters) {
  const root = filtersConfigToFilterRoot(filters);
  let count = 0;
  for (const group of root.groups) {
    for (const cond of group.conditions || []) {
      if (cond.value !== "" && cond.value != null) count += 1;
    }
  }
  return count;
}

function buildScoreColorScale(cells) {
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
    const red = { r: 220, g: 38, b: 38 };
    const orange = { r: 249, g: 115, b: 22 };
    const green = { r: 22, g: 163, b: 74 };
    let from;
    let to;
    let localT;
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
  return { getCellColor, minScore, maxScore };
}

function formatParamValue(v, rawKey) {
  if (v == null) return "-";
  if (rawKey === "drawdown" && typeof v === "number" && v > 0 && v <= 1) {
    return `${(v * 100).toFixed(1)}%`;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    if (rawKey === "profit_factor") return v.toFixed(2);
    return v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
  }
  return String(v);
}

function prettifyParamName(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const m = lower.match(/^(fast|slow|signal)(?:_|-)?period$/);
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)}Period`;
  if (lower === "stddev" || lower === "std_dev" || lower === "std-dev") return "StdDev";
  if (lower === "timeframe" || lower === "time_frame" || lower === "time-frame") return "TimeFrame";
  const chunks = s.split(/[_-]+/g).filter(Boolean);
  const title = (w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w);
  return chunks.map((c) => title(String(c))).join("") || s;
}

const METRIC_FIELDS = [
  { keys: ["mfe"], label: "MFE", decimals: 2, asPercent: true },
  { keys: ["mae"], label: "MAE", decimals: 2, asPercent: true },
  { keys: ["air"], label: "AIR", decimals: 2, asPercent: true },
  { keys: ["hitRate", "hit_rate"], label: "Hit Rate", decimals: 2, asPercent: true },
];

function pickMetric(row, keys) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function formatMetricVal(n, decimals, asPercent = false) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (asPercent && Math.abs(n) > 0 && Math.abs(n) <= 1) return `${(n * 100).toFixed(decimals)}%`;
  if (asPercent) return `${n.toFixed(decimals)}%`;
  return n.toFixed(decimals);
}

function formatCandidateRangeLines(cand) {
  return Object.entries(cand.params || {}).map(([key, value]) => {
    const label = String(key).toUpperCase();
    const val =
      typeof value === "number" && Number.isFinite(value)
        ? value % 1 === 0
          ? value.toFixed(0)
          : value.toFixed(3)
        : value;
    return `${label} ${val}`;
  });
}

function resolveCellIndex(cand, gridW) {
  if (cand.meta?.yi != null && cand.meta?.xi != null) {
    return cand.meta.yi * gridW + cand.meta.xi;
  }
  return null;
}

// ---------------------------------------------------------------------------
// SelectedEpochsPopoverContent
// ---------------------------------------------------------------------------

const SelectedEpochsPopoverContent = memo(function SelectedEpochsPopoverContent({
  bestCandidates,
  onRemoveCandidate,
  onClearAllCandidates,
  onSaveBest,
  saveBestLabel,
  gridW,
}) {
  return (
    <div className="flex flex-col max-h-[min(420px,70vh)] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.35)] px-3 py-2 shrink-0">
        <span className="text-[11px] font-medium text-[#f0f0f0]">Selected for best score</span>
        <div className="flex items-center gap-2">
          {onClearAllCandidates && bestCandidates.length > 0 && (
            <button
              type="button"
              onClick={onClearAllCandidates}
              className="text-[10px] text-[#8c8c8c] hover:text-[#d9d9d9]"
            >
              Clear all
            </button>
          )}
          <AppButton
            type="button"
            size="sm"
            className="h-7 px-2.5 text-[10px] bg-violet-600 hover:bg-violet-500 text-white border-violet-500/50"
            onClick={onSaveBest || undefined}
            disabled={!onSaveBest || bestCandidates.length === 0}
          >
            {saveBestLabel}
          </AppButton>
        </div>
      </div>

      {bestCandidates.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-[#8c8c8c]">
          Click heatmap cells (n=1) to select epochs.
        </p>
      ) : (
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-[10px] border-collapse">
            <thead className="sticky top-0 bg-[#19102b] text-[#8c8c8c]">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.35)] w-14">Index</th>
                <th className="px-2 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Range</th>
                <th className="px-2 py-1.5 text-right font-medium border-b border-[rgba(60,40,80,0.35)] w-14">Score</th>
                <th className="px-2 py-1.5 border-b border-[rgba(60,40,80,0.35)] w-8" />
              </tr>
            </thead>
            <tbody className="text-[#d9d9d9]">
              {bestCandidates.map((cand, idx) => {
                const cellIndex = resolveCellIndex(cand, gridW || 1) ?? idx;
                const rangeLines = formatCandidateRangeLines(cand);
                return (
                  <tr key={cand.id} className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]/60">
                    <td className="px-2 py-2 align-top font-mono text-[#a6a6a6]">{cellIndex}</td>
                    <td className="px-2 py-2 align-top">
                      <div className="space-y-0.5 font-mono text-[9px] leading-snug text-[#b8aecc]">
                        {rangeLines.length === 0 ? (
                          <span className="text-[#595959]">—</span>
                        ) : (
                          rangeLines.map((line) => (
                            <div key={line} className="truncate max-w-[220px]" title={line}>
                              {line}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top text-right font-mono text-emerald-300">
                      {cand.score != null ? cand.score.toFixed(2) : "—"}
                    </td>
                    <td className="px-1 py-2 align-top">
                      {onRemoveCandidate && (
                        <button
                          type="button"
                          onClick={() => onRemoveCandidate(cand.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-red-400/90 hover:text-red-300 hover:bg-red-500/10"
                          aria-label="Remove selection"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// HeatMapView
// ---------------------------------------------------------------------------

export const HeatMapView = memo(function HeatMapView({
  heatMapData,
  config,
  onCellClick,
  onZoomOut,
  onResetZoom,
  canZoomOut,
  canReset,
  zoomLevel = 0,
  isLoading = false,
  error = null,
  onRetry = null,
  onSaveBest = null,
  saveBestLabel = "Save selection",
  bestCandidates = [],
  onRemoveCandidate = null,
  onClearAllCandidates = null,
  onApplyFilters = null,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Popovers
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [epochsOpen, setEpochsOpen] = useState(false);

  // Local draft for the filters editor
  const [filterDraft, setFilterDraft] = useState(() => filtersConfigToFilterRoot(config?.filters));
  const [filterPresetDraft, setFilterPresetDraft] = useState(config?.filterPreset || "");

  // Sync draft when popover opens so user always edits a fresh copy of the current config
  useEffect(() => {
    if (filtersOpen) {
      setFilterDraft(filtersConfigToFilterRoot(config?.filters));
      setFilterPresetDraft(config?.filterPreset || "");
    }
  }, [filtersOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = useCallback(() => {
    onApplyFilters?.({ filterRoot: filterDraft, filterPreset: filterPresetDraft });
    setFiltersOpen(false);
  }, [filterDraft, filterPresetDraft, onApplyFilters]);

  const { getCellColor, minScore, maxScore } = useMemo(
    () => buildScoreColorScale(heatMapData?.cells || []),
    [heatMapData],
  );

  const stats = useMemo(() => {
    const allCells = heatMapData?.cells;
    if (!allCells) {
      return { records: 0, nonEmpty: 0, gridW: 0 };
    }
    const flat = allCells.flat();
    const gridW = heatMapData.W ?? allCells[0]?.length ?? 0;
    const nonEmpty = flat.filter((c) => c && c.count > 0);
    const records = flat.reduce((sum, c) => sum + (c?.count || 0), 0);
    return { records, nonEmpty: nonEmpty.length, gridW };
  }, [heatMapData]);

  const filtersApplied = useMemo(() => countAppliedFilters(config?.filters), [config?.filters]);

  const getIndicatorPrefixById = useCallback(
    (indicatorId) => {
      const list = Array.isArray(config?.indicators) ? config.indicators : [];
      const ind = list.find((i) => String(i?.id) === String(indicatorId));
      return ind?.shortName || ind?.displayName || ind?.name || ind?.type || "";
    },
    [config?.indicators],
  );

  const friendlyParamKey = useCallback(
    (rawKey) => {
      const key = String(rawKey || "");
      const parts = key.split("_");
      if (parts.length >= 2 && /^\d+(\.\d+)?$/.test(parts[0])) {
        const indicatorId = parts[0];
        const paramRaw = parts.slice(1).join("_");
        const prefix = getIndicatorPrefixById(indicatorId);
        const name = prettifyParamName(paramRaw) || paramRaw;
        return prefix ? `${prefix.toLowerCase()}.${name}` : name;
      }
      if (key.includes(".")) return key;
      return prettifyParamName(key) || key;
    },
    [getIndicatorPrefixById],
  );

  const formatAxisRange = (min, max, rawKey) => {
    if (
      min == null ||
      max == null ||
      (typeof min === "number" && !Number.isFinite(min)) ||
      (typeof max === "number" && !Number.isFinite(max))
    ) {
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

  const { xKeys = [], yKeys = [] } = heatMapData || {};

  const hoveredXAxisLines = hoveredCell ? axisRangeLines(xKeys, hoveredCell.paramRanges?.x) : [];
  const hoveredYAxisLines = hoveredCell ? axisRangeLines(yKeys, hoveredCell.paramRanges?.y) : [];

  const hoveredMetricLines = useMemo(() => {
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
          : `${formatMetricVal(min, decimals, asPercent)} — ${formatMetricVal(max, decimals, asPercent)}`;
      return { label, value };
    });
  }, [hoveredCell]);

  const hoveredEpochRange = useMemo(() => {
    if (!hoveredCell) return "—";
    const results = Array.isArray(hoveredCell.results) ? hoveredCell.results : [];
    const epochs = results
      .map((r, i) => r.epoch ?? r.epochNumber ?? i + 1)
      .filter((v) => v != null && Number.isFinite(Number(v)));
    if (!epochs.length) return hoveredCell.count > 0 ? `1 — ${hoveredCell.count}` : "—";
    const min = Math.min(...epochs);
    const max = Math.max(...epochs);
    return min === max ? String(min) : `${min} — ${max}`;
  }, [hoveredCell]);

  const handleCellEnter = useCallback((cell) => {
    if (!cell || cell.count === 0) return;
    setHoveredCell(cell);
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const legendGradient = useMemo(() => {
    const stops = [];
    for (let i = 0; i <= HEATMAP_LEGEND_STOPS; i += 1) {
      const t = i / HEATMAP_LEGEND_STOPS;
      const sample = minScore + (maxScore - minScore) * t;
      stops.push(`${getCellColor(sample)} ${(t * 100).toFixed(1)}%`);
    }
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [getCellColor, minScore, maxScore]);

  const gridElement = useMemo(() => {
    const allCells = heatMapData?.cells;
    if (!allCells) return null;
    const gridW = heatMapData.W ?? allCells[0]?.length ?? 1;
    const gridH = heatMapData.H ?? allCells.length ?? 1;
    return (
      <div
        className="inline-grid gap-px w-fit"
        style={{
          gridTemplateColumns: `repeat(${gridW}, ${HEATMAP_CELL_PX}px)`,
          gridTemplateRows: `repeat(${gridH}, ${HEATMAP_CELL_PX}px)`,
        }}
      >
        {allCells.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const empty = !cell || cell.count === 0;
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className={cx(
                  "flex flex-col items-center justify-center rounded-sm border font-mono text-[9px] leading-tight transition-[filter,border-color] overflow-hidden",
                  empty
                    ? "cursor-default border-[rgba(60,40,80,0.35)] bg-[#111111]"
                    : "cursor-pointer border-white/10 hover:brightness-110 hover:border-white/25",
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
                onMouseEnter={() => !empty && handleCellEnter(cell)}
                onMouseLeave={handleCellLeave}
                onClick={() => !empty && onCellClick?.(cell)}
              >
                {!empty && (
                  <>
                    <span className="leading-tight text-white/95">
                      {cell.avgScore != null ? cell.avgScore.toFixed(2) : "—"}
                    </span>
                    <span className="text-[8px] text-white/85 mt-0.5">n={cell.count}</span>
                  </>
                )}
              </button>
            );
          }),
        )}
      </div>
    );
  }, [heatMapData, getCellColor, handleCellEnter, handleCellLeave, onCellClick]);

  if (error) {
    return (
      <div className="p-4">
        <div className="py-6 text-center text-[12px] text-[#a6a6a6]">{error}</div>
        {onRetry && (
          <div className="flex justify-center mt-2">
            <AppButton type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </AppButton>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-[11px] text-[#8c8c8c] mb-3">Building heatmap…</div>
        <div
          className="w-full max-w-full grid gap-1 rounded-lg overflow-hidden bg-[#1a1a1a]"
          style={{
            gridTemplateColumns: "repeat(25, 1fr)",
            gridTemplateRows: "repeat(25, 1fr)",
            aspectRatio: "1",
          }}
        >
          {Array.from({ length: 625 }, (_, i) => (
            <div key={i} className="rounded bg-[#252525] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!heatMapData || !heatMapData.cells) return null;

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Levels + stats */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#b8aecc]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#8c8c8c]">Levels</span>
            <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 font-mono text-[11px] text-[#d9d9d9]">
              L{zoomLevel}
            </span>
            {(canZoomOut || canReset) && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={onZoomOut}
                  disabled={!canZoomOut}
                  className={cx(
                    "rounded border border-[rgba(60,40,80,0.35)] px-2 py-0.5 text-[10px]",
                    canZoomOut ? "text-[#d9d9d9] hover:bg-[#1a1430]" : "opacity-40 cursor-not-allowed text-[#8c8c8c]",
                  )}
                >
                  Zoom out
                </button>
                <button
                  type="button"
                  onClick={onResetZoom}
                  disabled={!canReset}
                  className={cx(
                    "rounded border border-[rgba(60,40,80,0.35)] px-2 py-0.5 text-[10px]",
                    canReset ? "text-[#d9d9d9] hover:bg-[#1a1430]" : "opacity-40 cursor-not-allowed text-[#8c8c8c]",
                  )}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          <span>
            Records: <span className="font-mono text-[#d9d9d9]">{stats.records}</span>
          </span>
          <span>
            Non-empty cells: <span className="font-mono text-[#d9d9d9]">{stats.nonEmpty}</span>
          </span>
          <span>
            Node level: <span className="font-mono text-[#d9d9d9]">{zoomLevel}</span>
          </span>
          <span>
            Score range:{" "}
            <span className="font-mono text-[#d9d9d9]">
              {minScore.toFixed(2)} — {maxScore.toFixed(2)}
            </span>
          </span>
        </div>

        {/* Right: interactive pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Filters pill */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2.5 py-1 text-[10px] text-[#b8aecc] hover:bg-[#231646] hover:border-[rgba(120,80,180,0.5)] transition-colors"
              >
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    filtersApplied > 0 ? "bg-violet-400" : "bg-[#8c8c8c]",
                  )}
                />
                {filtersApplied} filters applied
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-[360px] p-0 border-[rgba(60,40,80,0.45)] bg-[#170f29] shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
            >
              <HeatmapFiltersEditor
                filterRoot={filterDraft}
                onFilterRootChange={setFilterDraft}
                filterPreset={filterPresetDraft}
                onFilterPresetChange={setFilterPresetDraft}
                onApply={handleApplyFilters}
                applyLabel="Apply"
              />
            </PopoverContent>
          </Popover>

          {/* Epochs selected pill */}
          <Popover open={epochsOpen} onOpenChange={setEpochsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2.5 py-1 text-[10px] text-[#b8aecc] hover:bg-[#231646] hover:border-[rgba(120,80,180,0.5)] transition-colors"
              >
                <span
                  className={cx(
                    "h-2 w-2 rounded-full",
                    bestCandidates.length > 0 ? "bg-white/90" : "bg-[#8c8c8c]",
                  )}
                />
                {bestCandidates.length} epochs selected
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-[420px] p-0 border-[rgba(60,40,80,0.45)] bg-[#170f29] shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
            >
              <SelectedEpochsPopoverContent
                bestCandidates={bestCandidates}
                onRemoveCandidate={onRemoveCandidate}
                onClearAllCandidates={onClearAllCandidates}
                onSaveBest={onSaveBest}
                saveBestLabel={saveBestLabel}
                gridW={stats.gridW}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main grid area — centered, cell details bottom-right */}
      <div className="relative flex flex-col items-center justify-start min-h-[520px] py-4 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#0f0a18]">
        {/* Centered grid + legend */}
        <div className="overflow-auto max-w-full">{gridElement}</div>

        {/* Legend centered below grid */}
        <div className="mt-3 flex items-center gap-2 max-w-[700px] w-full px-4">
          <span className="font-mono text-[10px] text-[#8c8c8c] shrink-0">{minScore.toFixed(2)}</span>
          <div
            className="h-2 flex-1 rounded-full border border-[rgba(60,40,80,0.35)]"
            style={{ background: legendGradient }}
          />
          <span className="font-mono text-[10px] text-[#8c8c8c] shrink-0">{maxScore.toFixed(2)}</span>
        </div>

        {/* Cell details hover panel — absolute, bottom-right, non-interactive */}
        {hoveredCell && (
          <div className="absolute bottom-3 right-3 w-[min(340px,calc(100%-1.5rem))] rounded-xl border border-[rgba(60,40,80,0.45)] bg-[#170f29]/95 shadow-[0_16px_40px_rgba(6,3,20,0.45)] backdrop-blur-sm p-3 text-[10px] text-[#d9d9d9] space-y-2 pointer-events-none z-10">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8c8c8c]">Cell details</div>
            <div className="space-y-0.5 font-mono">
              <div>
                avgScore:{" "}
                <span className="text-emerald-300">
                  {hoveredCell.avgScore != null ? hoveredCell.avgScore.toFixed(3) : "—"}
                </span>
              </div>
              <div>
                min — max:{" "}
                <span>
                  {hoveredCell.minScore != null ? hoveredCell.minScore.toFixed(3) : "—"} —{" "}
                  {hoveredCell.maxScore != null ? hoveredCell.maxScore.toFixed(3) : "—"}
                </span>
              </div>
              <div>
                count: <span className="text-emerald-300">{hoveredCell.count}</span>
              </div>
            </div>

            <div className="pt-1 border-t border-[rgba(60,40,80,0.35)]">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-[#8c8c8c] mb-0.5">Epoch</div>
              <div className="font-mono">{hoveredEpochRange}</div>
            </div>

            <div className="pt-1 border-t border-[rgba(60,40,80,0.35)]">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-[#8c8c8c] mb-1">Indicator ranges</div>
              <div className="rounded border border-[rgba(60,40,80,0.35)] bg-[#120a20] p-2 font-mono leading-relaxed space-y-1">
                <div className="text-[#8c8c8c]">X Axis:</div>
                {hoveredXAxisLines.length === 0 ? (
                  <div className="text-[#595959] pl-1">—</div>
                ) : (
                  hoveredXAxisLines.map((line) => (
                    <div key={`x-${line.label}`} className="pl-1 text-[#d9d9d9]">
                      {line.label} ({line.value})
                    </div>
                  ))
                )}
                <div className="text-[#8c8c8c] pt-1">Y Axis:</div>
                {hoveredYAxisLines.length === 0 ? (
                  <div className="text-[#595959] pl-1">—</div>
                ) : (
                  hoveredYAxisLines.map((line) => (
                    <div key={`y-${line.label}`} className="pl-1 text-[#d9d9d9]">
                      {line.label} ({line.value})
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-1 border-t border-[rgba(60,40,80,0.35)]">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-[#8c8c8c] mb-1">Metrics</div>
              <div className="rounded border border-[rgba(60,40,80,0.35)] bg-[#120a20] p-2 font-mono space-y-0.5">
                {hoveredMetricLines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-3">
                    <span className="text-[#a6a6a6]">{line.label}</span>
                    <span className="text-emerald-300/90 tabular-nums">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
