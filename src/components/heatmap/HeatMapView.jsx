import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";

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
  bestCandidates = [],
  onRemoveCandidate = null,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

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

  const { cells } = heatMapData;

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

  const formatParamValue = (v) => {
    if (v == null) return "-";
    if (typeof v === "number" && Number.isFinite(v)) {
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

  const getCellParamLines = (cell) => {
    const results = Array.isArray(cell?.results) ? cell.results : [];
    if (!results.length) return [];

    const byKey = new Map();
    for (const r of results) {
      const p = r?.params;
      if (!p || typeof p !== "object") continue;
      for (const [rawK, rawV] of Object.entries(p)) {
        const k = friendlyParamKey(rawK);
        if (!k) continue;
        if (!byKey.has(k)) byKey.set(k, []);
        byKey.get(k).push(rawV);
      }
    }
    const sortedKeys = [...byKey.keys()].sort((a, b) => String(a).localeCompare(String(b)));

    const lines = [];
    for (const k of sortedKeys) {
      const vals = (byKey.get(k) || []).filter((v) => v != null);
      if (!vals.length) continue;

      const allNumeric = vals.every((v) => typeof v === "number" && Number.isFinite(v));
      if (allNumeric) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const value =
          cell.count > 1 ? `${formatParamValue(min)}–${formatParamValue(max)}` : formatParamValue(vals[0]);
        lines.push({ key: k, value });
        continue;
      }

      const uniq = [...new Set(vals.map((v) => String(v)))];
      const value = cell.count > 1 ? uniq.slice(0, 4).join(", ") : uniq[0];
      lines.push({ key: k, value });
    }
    return lines;
  };

  const hoveredCellParamLines = hoveredCell ? getCellParamLines(hoveredCell) : [];

  const computeTooltipPosFromRect = (rect) => {
    const pad = 10;
    const tooltipW = 320;
    const tooltipH = 220;
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
    <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[#d9d9d9]">HeatMap</h3>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px]">
          <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-0.5", ui.textMuted)}>
            <span>Mock X params</span>
            <span>Mock Y params</span>
          </div>
          <span className="font-mono text-[#a6a6a6]">AvgScore range: mock</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
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

      <div className="flex items-start gap-4">
        <div className="overflow-x-auto overflow-y-auto min-w-0 max-w-full">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "repeat(10, 1fr)" }}
          >
            {Array.from({ length: 10 }).flatMap((_, rowIndex) =>
              Array.from({ length: 10 }).map((__, colIndex) => {
                const cell = cells[rowIndex]?.[colIndex];
                const empty = !cell || cell.count === 0;
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={cx(
                      "flex flex-col items-center justify-center rounded-lg border font-mono text-[10px] transition-[filter,border-color] w-8 h-8",
                      empty
                        ? "cursor-default border-white/[0.09] bg-[#111111]"
                        : "cursor-pointer border-white/10 hover:brightness-110 hover:border-white/20",
                    )}
                    style={
                      empty
                        ? undefined
                        : {
                            backgroundColor: getCellColor(cell.avgScore),
                          }
                    }
                    onMouseEnter={(e) => !empty && handleCellEnter(cell, e)}
                    onMouseLeave={handleCellLeave}
                    onClick={() => !empty && onCellClick && onCellClick(cell)}
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

        <div className="flex flex-col items-start gap-2 min-w-[180px]">
          <button
            type="button"
            onClick={onSaveBest || undefined}
            disabled={!onSaveBest}
            className={cx(
              ui.btnPrimary,
              "h-7 px-3 text-[11px] whitespace-nowrap",
              !onSaveBest && "opacity-50 cursor-not-allowed",
            )}
          >
            Select for Stage 2
          </button>
          {Array.isArray(bestCandidates) && bestCandidates.length > 0 && (
            <div className="mt-2 w-full max-w-xs border border-[#303030] rounded bg-[#141414] p-2 space-y-1">
              <div className="text-[10px] font-medium text-[#d9d9d9]">Marked cells</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {bestCandidates.map((cand) => {
                  const paramsStr =
                    cand.params &&
                    Object.entries(cand.params)
                      .map(([k, v]) => {
                        const [prefix, ...rest] = String(k).split(".");
                        const name = rest.join(".") || prefix;
                        const label =
                          rest.length > 0 ? `${prefix} ${name}` : name;
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
                      className="border border-[#303030] rounded px-2 py-1 text-[10px] text-[#d9d9d9] bg-[#111111]"
                    >
                      <div className="flex justify-between gap-2 items-center">
                        <span className="font-mono text-emerald-300">
                          {cand.score != null ? cand.score.toFixed(3) : "-"}
                        </span>
                        <span className="text-[#8c8c8c]">
                          ({cand.meta?.xi + 1},{cand.meta?.yi + 1})
                        </span>
                        {onRemoveCandidate && (
                          <button
                            type="button"
                            onClick={() => onRemoveCandidate(cand.id)}
                            className="text-red-400/90 hover:text-red-300 text-[11px] px-1"
                            aria-label="Remove candidate"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {paramsStr && (
                        <div className="mt-0.5 text-[9px] text-[#a6a6a6]">
                          {paramsStr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {hoveredCell && tooltipPos && (
        <div
          className="fixed z-[60] text-left text-[11px] text-[#d9d9d9]"
          style={{ left: tooltipPos.left, top: tooltipPos.top, width: 320 }}
        >
          <div className="rounded-lg border border-[#303030] bg-[#141414] shadow-xl p-3 space-y-1">
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
            <div className="pt-1">
              <div className="text-[10px] text-[#8c8c8c] mb-1">Indicator params</div>
              {hoveredCellParamLines.length === 0 ? (
                <div className="text-[10px] text-[#8c8c8c]">No params in this cell.</div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-[#303030] rounded bg-[#111111] p-2 space-y-1">
                  {hoveredCellParamLines.map((line) => (
                    <div key={line.key} className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[#d9d9d9] break-all">{line.key}</span>
                      <span className="font-mono text-emerald-300 whitespace-nowrap">{line.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[#8c8c8c]">
        Mock HeatMap view; click cell to drill down (when wired).
      </p>
    </div>
  );
});
