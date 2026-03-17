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
                    onMouseEnter={() => !empty && setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
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
            ☆ Save as Best
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

        {hoveredCell && (
          <div className="mt-4 text-left text-[11px] text-[#d9d9d9] space-y-1">
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
          </div>
        )}
      </div>

      <p className="mt-2 text-[10px] text-[#8c8c8c]">
        Mock HeatMap view; click cell to drill down (when wired).
      </p>
    </div>
  );
});
