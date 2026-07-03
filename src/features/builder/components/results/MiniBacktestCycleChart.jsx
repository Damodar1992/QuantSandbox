import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { cx } from "../../../../constants/ui";

const W = 940;
const H = 250;
const PAD_L = 54;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 20;

function getReturnPct(row) {
  if (row.roiRaw != null && !Number.isNaN(row.roiRaw)) return row.roiRaw * 100;
  return (row.c.P_exit / row.c.P0 - 1) * 100;
}

function statusLabel(row, returnPct) {
  if (row.status === "liq") return "LIQ";
  return returnPct >= 0 ? "WIN" : "LOSS";
}

function barColor(row, returnPct) {
  if (row.status === "liq") return "#fbbf24";
  return returnPct >= 0 ? "#22c55e" : "#f87171";
}

function CycleChartTooltip({ row, returnPct, x, y }) {
  const c = row.c;
  const positive = returnPct >= 0;

  return (
    <div
      className="fixed z-[60] pointer-events-none rounded-lg border border-[rgba(255,255,255,0.13)] bg-[#1f1f30] px-2.5 py-2 text-[11px] shadow-[0_6px_22px_rgba(0,0,0,0.45)]"
      style={{
        left: Math.min(x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 190),
        top: y + 10,
      }}
    >
      <b className="block mb-1 text-[#faf7fd]">Cycle #{c.id}</b>
      <div className="flex items-center gap-1.5 py-px font-mono tabular-nums text-[#8c8c8c]">
        <span className="inline-block h-2 w-2 shrink-0 rounded-sm bg-emerald-400" />
        MFE% +{c.mfe_pct.toFixed(2)}%
      </div>
      <div className="flex items-center gap-1.5 py-px font-mono tabular-nums text-[#8c8c8c]">
        <span
          className={cx(
            "inline-block h-2 w-2 shrink-0 rounded-sm",
            positive ? "bg-emerald-400" : "bg-red-400",
          )}
        />
        Return% {positive ? "+" : ""}
        {returnPct.toFixed(2)}%
      </div>
      <div className="flex items-center gap-1.5 py-px font-mono tabular-nums text-[#8c8c8c]">
        <span className="inline-block h-2 w-2 shrink-0 rounded-sm bg-red-400" />
        MAE% {c.mae_pct.toFixed(2)}%
      </div>
    </div>
  );
}

export const MiniBacktestCycleChart = memo(function MiniBacktestCycleChart({ rows = [] }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const pts = useMemo(
    () => rows.filter((x) => x.status !== "halt" && x.status !== "skip"),
    [rows],
  );

  const chart = useMemo(() => {
    if (!pts.length) return null;

    let hi = Math.max(...pts.map((p) => p.c.mfe_pct), 0.5);
    let lo = Math.min(...pts.map((p) => p.c.mae_pct), -0.5);
    const rets = pts.map(getReturnPct);
    const maxRet = Math.max(...rets);
    const minRet = Math.min(...rets);
    const margin = (hi - lo) * 0.08;
    hi += margin;
    lo -= margin;

    const n = pts.length;
    const slot = (W - PAD_L - PAD_R) / n;
    const bw = Math.max(1.5, Math.min(11, slot * 0.55));
    const sx = (i) => PAD_L + slot * (i + 0.5);
    const sy = (v) => H - PAD_B - ((H - PAD_T - PAD_B) * (v - lo)) / (hi - lo);
    const y0 = sy(0);

    return { pts, hi, lo, maxRet, minRet, slot, bw, sx, sy, y0 };
  }, [pts]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!chart || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * W;
      let idx = Math.floor((vx - PAD_L) / chart.slot);
      idx = Math.max(0, Math.min(chart.pts.length - 1, idx));
      setHoverIdx(idx);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [chart],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
    setTooltipPos(null);
  }, []);

  if (!chart) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] text-[12px] text-[#8c8c8c]">
        No executed cycles to chart
      </div>
    );
  }

  const hoverRow = hoverIdx != null ? chart.pts[hoverIdx] : null;
  const hoverReturn = hoverRow ? getReturnPct(hoverRow) : 0;
  const hoverX = hoverIdx != null ? chart.sx(hoverIdx) : 0;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#8c8c8c] leading-snug">
        Each bar is one cycle — its height is the executed Return%:{" "}
        <b className="font-semibold text-emerald-400">green = win</b>,{" "}
        <b className="font-semibold text-red-400">red = loss</b>,{" "}
        <b className="font-semibold text-amber-400">amber = liquidated</b>. The thin wick spans the price
        excursion from MFE (top) to MAE (bottom).
      </p>

      <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] p-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[250px] cursor-crosshair min-w-[640px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <line
            x1={PAD_L}
            y1={chart.y0}
            x2={W - PAD_R}
            y2={chart.y0}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1}
            opacity={0.5}
          />
          <text x={PAD_L - 6} y={chart.sy(chart.hi) + 9} textAnchor="end" fontSize={9} fill="#22c55e">
            max MFE +{chart.hi.toFixed(1)}%
          </text>
          <text x={PAD_L - 6} y={chart.sy(chart.maxRet) + 3} textAnchor="end" fontSize={8} fill="#22c55e">
            max Ret +{chart.maxRet.toFixed(1)}%
          </text>
          <text x={PAD_L - 6} y={chart.y0 + 3} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.5)">
            entry 0%
          </text>
          <text x={PAD_L - 6} y={chart.sy(chart.minRet) + 3} textAnchor="end" fontSize={8} fill="#f87171">
            min Ret {chart.minRet.toFixed(1)}%
          </text>
          <text x={PAD_L - 6} y={chart.sy(chart.lo) - 2} textAnchor="end" fontSize={9} fill="#f87171">
            min MAE {chart.lo.toFixed(1)}%
          </text>

          {chart.pts.map((row, i) => {
            const c = row.c;
            const returnPct = getReturnPct(row);
            const x = chart.sx(i);
            const yEx = chart.sy(returnPct);
            const bTop = Math.min(chart.y0, yEx);
            const bH = Math.max(1.6, Math.abs(yEx - chart.y0));
            const col = barColor(row, returnPct);

            return (
              <g key={c.id}>
                <line
                  x1={x}
                  y1={chart.sy(c.mfe_pct)}
                  x2={x}
                  y2={chart.sy(c.mae_pct)}
                  stroke="rgba(255,255,255,0.13)"
                  strokeWidth={1.1}
                />
                <rect
                  x={x - chart.bw / 2}
                  y={bTop}
                  width={chart.bw}
                  height={bH}
                  fill={col}
                  opacity={0.92}
                  rx={1}
                />
                <circle cx={x} cy={chart.y0} r={1.6} fill="#fff" opacity={0.85} />
              </g>
            );
          })}

          {hoverRow ? (
            <g pointerEvents="none">
              <circle cx={hoverX} cy={chart.sy(hoverRow.c.mfe_pct)} r={3} fill="#22c55e" />
              <circle
                cx={hoverX}
                cy={chart.sy(hoverReturn)}
                r={3.2}
                fill={hoverReturn >= 0 ? "#22c55e" : "#f87171"}
              />
              <circle cx={hoverX} cy={chart.sy(hoverRow.c.mae_pct)} r={3} fill="#f87171" />
            </g>
          ) : null}
        </svg>
      </div>

      {hoverRow && tooltipPos ? (
        <CycleChartTooltip row={hoverRow} returnPct={hoverReturn} x={tooltipPos.x} y={tooltipPos.y} />
      ) : null}
    </div>
  );
});
