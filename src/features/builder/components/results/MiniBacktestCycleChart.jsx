import React, { memo, useMemo } from "react";

export const MiniBacktestCycleChart = memo(function MiniBacktestCycleChart({ rows = [] }) {
  const svg = useMemo(() => {
    const pts = rows.filter((x) => x.status !== "halt" && x.status !== "skip");
    if (!pts.length) return null;

    const W = 940;
    const H = 280;
    const padL = 52;
    const padR = 14;
    const padT = 18;
    const padB = 26;

    let hi = Math.max(...pts.map((p) => p.c.mfe_pct), 0.5);
    let lo = Math.min(...pts.map((p) => p.c.mae_pct), -0.5);
    const m = (hi - lo) * 0.08;
    hi += m;
    lo -= m;

    const n = pts.length;
    const slot = (W - padL - padR) / n;
    const bw = Math.max(1.5, Math.min(11, slot * 0.58));
    const sx = (i) => padL + slot * (i + 0.5);
    const sy = (v) => H - padB - ((H - padT - padB) * (v - lo)) / (hi - lo);
    const y0 = sy(0);

    let body = "";
    pts.forEach((p, i) => {
      const x = sx(i);
      const c = p.c;
      const exR = (c.P_exit / c.P0 - 1) * 100;
      const isLiq = p.status === "liq";
      const col = isLiq ? "#fbbf24" : exR >= 0 ? "#22c55e" : "#f87171";
      const yEx = sy(exR);
      const bTop = Math.min(y0, yEx);
      const bH = Math.max(1.6, Math.abs(yEx - y0));
      const tip = `#${c.id} · ${isLiq ? "LIQUIDATED" : exR >= 0 ? "WIN" : "LOSS"}\nentry 0% → exit ${exR >= 0 ? "+" : ""}${exR.toFixed(2)}%\nMFE +${c.mfe_pct.toFixed(2)}% MAE ${c.mae_pct.toFixed(2)}%\nduration ${c.duration_candles} candles`;

      body += `<g><title>${tip}</title>`;
      body += `<line x1="${x.toFixed(1)}" y1="${sy(c.mfe_pct).toFixed(1)}" x2="${x.toFixed(1)}" y2="${sy(c.mae_pct).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="1.1" opacity="0.75"/>`;
      body += `<rect x="${(x - bw / 2).toFixed(1)}" y="${bTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${bH.toFixed(1)}" fill="${col}" opacity="0.92" rx="1"/>`;
      body += `<circle cx="${x.toFixed(1)}" cy="${y0.toFixed(1)}" r="${Math.min(2, bw / 2 + 0.5).toFixed(1)}" fill="#fff" opacity="0.9"/>`;
      body += `</g>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-[280px]">
      <line x1="${padL}" y1="${y0.toFixed(1)}" x2="${W - padR}" y2="${y0.toFixed(1)}" stroke="rgba(255,255,255,0.35)" stroke-width="1" opacity="0.5"/>
      <text x="${padL - 7}" y="${(sy(hi) + 9).toFixed(0)}" text-anchor="end" font-size="9" fill="#22c55e">MFE +${hi.toFixed(1)}%</text>
      <text x="${padL - 7}" y="${(y0 + 3).toFixed(0)}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.5)">entry 0%</text>
      <text x="${padL - 7}" y="${(sy(lo) - 2).toFixed(0)}" text-anchor="end" font-size="9" fill="#f87171">MAE ${lo.toFixed(1)}%</text>
      ${body}
    </svg>`;
  }, [rows]);

  if (!svg) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] text-[12px] text-[#8c8c8c]">
        No executed cycles to chart
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] p-3 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
