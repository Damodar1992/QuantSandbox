import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { cx, ui } from "../../constants/ui";
import {
  clamp,
  formatScore,
  heatmapScoreToColor,
  HEATMAP_LEGEND_STOPS,
  HEATMAP_CELL_PX,
  HEATMAP_GAP_PX,
  EMPTY_CELL_BG,
} from "../../utils/heatmap";

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
}) {
  const gridRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, flipX: false, flipY: false });

  if (error) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
        <h3 className="text-[13px] font-semibold text-[#d9d9d9] mb-2">HeatMap</h3>
        <div className="py-6 text-center text-[12px] text-[#a6a6a6]">{error}</div>
        {onRetry && (
          <div className="flex justify-center mt-2">
            <button type="button" onClick={onRetry} className={cx(ui.btn, "text-[11px] px-3 py-1.5")}>Retry</button>
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
        <div className="aspect-square w-full max-w-full grid gap-1 rounded-lg overflow-hidden bg-[#1a1a1a]" style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(5, 1fr)" }}>
          {Array.from({ length: 25 }, (_, i) => <div key={i} className="rounded-lg bg-[#252525] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!heatMapData || !heatMapData.cells) return null;
  const { cells, W, H } = heatMapData;

  const hasAnyData = useMemo(() => cells.some((row) => row.some((c) => c.count > 0)), [cells]);

  const scoreRange = useMemo(() => {
    let minS = 1;
    let maxS = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const cell = cells[r][c];
      if (cell.count > 0) {
        minS = Math.min(minS, cell.avgScore);
        maxS = Math.max(maxS, cell.avgScore);
      }
    }
    return { min: minS > maxS ? 0 : minS, max: maxS };
  }, [cells, W, H]);

  const scoreToT01 = useCallback(
    (score) => {
      if (score == null) return 0;
      const { min: a, max: b } = scoreRange;
      if (b === a) return 0.5;
      return clamp((score - a) / (b - a));
    },
    [scoreRange]
  );

  const handleMouseMove = useCallback((e, ri, ci) => {
    setHoveredCell([ri, ci]);
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const flipX = x > rect.width / 2;
    const flipY = y > rect.height / 2;
    setTooltipPos({ x: e.clientX, y: e.clientY, flipX, flipY, rect });
  }, []);

  const renderTooltip = (cell) => {
    const xRanges = cell.paramRanges?.x ? Object.entries(cell.paramRanges.x).map(([k, r]) => `${k}: ${r.min}..${r.max}`).join("; ") : "—";
    const yRanges = cell.paramRanges?.y ? Object.entries(cell.paramRanges.y).map(([k, r]) => `${k}: ${r.min}..${r.max}`).join("; ") : "—";
    const fixedStr = config.fixedParams && Object.keys(config.fixedParams).length > 0
      ? Object.entries(config.fixedParams).map(([k, v]) => `${k}=${v}`).join(", ")
      : "—";
    const cellTitle = cell.xi != null && cell.yi != null ? `Cell (${cell.xi + 1}, ${cell.yi + 1})` : "Cell";
    return (
      <div className="text-left text-[11px] text-[#d9d9d9] space-y-2 pointer-events-none rounded-lg border border-[#303030] bg-[#1a1a1a] shadow-lg p-3 max-w-[280px]">
        <div className="font-medium text-[#f0f0f0]">{cellTitle}</div>
        <div className="space-y-0.5">
          <div>avgScore: <span className="text-emerald-400 font-mono">{formatScore(cell.avgScore)}</span></div>
          <div>min..max: <span className="font-mono">{formatScore(cell.minScore)}..{formatScore(cell.maxScore)}</span></div>
          <div>count: <span className="text-emerald-400">{cell.count}</span></div>
          <div>fixed params: <span className="text-[#a6a6a6]">{fixedStr}</span></div>
        </div>
        <div className="border-t border-[#303030] my-1.5" />
        <div className="space-y-0.5 text-[#a6a6a6]">
          <div>X ranges: {xRanges}</div>
          <div>Y ranges: {yRanges}</div>
        </div>
        <div className="text-[10px] text-[#8c8c8c] pt-0.5">Click cell to zoom (rebuilds matrix for this subset).</div>
      </div>
    );
  };

  const isZoomable = (cell) =>
    cell.count > 0 &&
    cell.zoomRanges &&
    Object.keys(cell.zoomRanges).length > 0;

  return (
    <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
      <div className="mb-3">
        <h3 className="text-[13px] font-semibold text-[#d9d9d9]">HeatMap</h3>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px]">
          <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-0.5", ui.textMuted)}>
            <span>X params: {Array.isArray(config.xAxis) ? config.xAxis.join(", ") : config.xAxis}</span>
            <span>Y params: {Array.isArray(config.yAxis) ? config.yAxis.join(", ") : config.yAxis}</span>
            <span>Other / fixed: {Object.keys(config.fixedParams || {}).length ? Object.entries(config.fixedParams).map(([k, v]) => `${k}=${v}`).join(", ") : "—"}</span>
          </div>
          <span className="font-mono text-[#a6a6a6]">AvgScore range: {formatScore(scoreRange.min)}..{formatScore(scoreRange.max)}</span>
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
            className={cx("rounded-lg border border-[#303030] px-3 py-1.5 text-[11px] transition-colors", canZoomOut ? "bg-transparent text-[#d9d9d9] hover:bg-[#252525]" : "opacity-50 cursor-not-allowed text-[#8c8c8c]")}
          >
            Zoom Out
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            disabled={!canReset}
            className={cx("rounded-lg border border-[#303030] px-3 py-1.5 text-[11px] transition-colors", canReset ? "bg-transparent text-[#d9d9d9] hover:bg-[#252525]" : "opacity-50 cursor-not-allowed text-[#8c8c8c]")}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto min-w-0 max-w-full">
        <div
          ref={gridRef}
          className="relative inline-block"
          style={{
            width: W * HEATMAP_CELL_PX + (W - 1) * HEATMAP_GAP_PX,
            height: H * HEATMAP_CELL_PX + (H - 1) * HEATMAP_GAP_PX,
          }}
        >
          <div
            className="absolute inset-0 grid"
            style={{
              gap: HEATMAP_GAP_PX,
              gridTemplateColumns: `repeat(${W}, ${HEATMAP_CELL_PX}px)`,
              gridTemplateRows: `repeat(${H}, ${HEATMAP_CELL_PX}px)`,
            }}
          >
            {cells.flatMap((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const empty = cell.count === 0;
                const zoomable = !empty && isZoomable(cell);
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    className={cx(
                      "flex flex-col items-center justify-center rounded-lg border font-mono text-[10px] transition-[filter,border-color] w-full h-full min-w-0 min-h-0 @container",
                      empty ? "cursor-default border-white/[0.09]" : "cursor-pointer border-white/10 hover:brightness-110 hover:border-white/20"
                    )}
                    style={{
                      backgroundColor: empty ? EMPTY_CELL_BG : heatmapScoreToColor(scoreToT01(cell.avgScore)),
                      borderWidth: "1px",
                    }}
                    aria-label={`Cell ${rowIndex},${colIndex} avgScore=${formatScore(cell.avgScore)} count=${cell.count}`}
                    onMouseEnter={(e) => !empty && handleMouseMove(e, rowIndex, colIndex)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => zoomable && onCellClick(cell)}
                    onKeyDown={(e) => { if (e.key === "Enter" && zoomable) onCellClick(cell); }}
                  >
                    {!empty && (
                      <>
                        <span className="leading-tight text-white/90">{formatScore(cell.avgScore)}</span>
                        <span className="text-[9px] text-white/80 mt-0.5 hidden @[28px]:block">n={cell.count}</span>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {hoveredCell != null && (() => {
            const [ri, ci] = hoveredCell;
            const cell = cells[ri]?.[ci];
            if (!cell || cell.count === 0) return null;
            const { x, y, flipX, flipY } = tooltipPos;
            const offset = 12;
            return (
              <div
                className="fixed z-30 pointer-events-none"
                style={{
                  left: flipX ? undefined : x + offset,
                  right: flipX ? window.innerWidth - x + offset : undefined,
                  top: flipY ? undefined : y + offset,
                  bottom: flipY ? window.innerHeight - y + offset : undefined,
                  transform: [flipX && "translateX(-100%)", flipY && "translateY(-100%)"].filter(Boolean).join(" ") || undefined,
                }}
              >
                {renderTooltip(cell, ri, ci)}
              </div>
            );
          })()}

          {!hasAnyData && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#141414]/80 rounded-lg pointer-events-none">
              <span className="text-[12px] text-[#8c8c8c]">No results for selected filters</span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-[10px] text-[#8c8c8c]">Equal-count bins; best cluster centered. Click cell to drill down.</p>

      <div className="mt-3 flex justify-center items-center gap-2">
        <span className="font-mono text-[10px] text-[#8c8c8c]">{formatScore(scoreRange.min)}</span>
        <div
          className="flex-1 max-w-[200px] h-3 rounded overflow-hidden border border-white/[0.08]"
          style={{
            background: `linear-gradient(to right, ${Array.from({ length: HEATMAP_LEGEND_STOPS }, (_, i) => `${heatmapScoreToColor(i / (HEATMAP_LEGEND_STOPS - 1))} ${(i / (HEATMAP_LEGEND_STOPS - 1)) * 100}%`).join(", ")})`,
          }}
        />
        <span className="font-mono text-[10px] text-[#8c8c8c]">{formatScore(scoreRange.max)}</span>
      </div>
    </div>
  );
});
