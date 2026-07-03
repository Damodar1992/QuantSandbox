import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { formatMbMoney, formatMbPct } from "../../utils/miniBacktestDisplay";

function StatusPill({ status }) {
  const map = {
    win: { label: "WIN", cls: "bg-emerald-500/15 text-emerald-300" },
    loss: { label: "LOSS", cls: "bg-red-500/15 text-red-300" },
    liq: { label: "LIQ", cls: "bg-amber-500/15 text-amber-300" },
    skip: { label: "SKIP", cls: "bg-[#2a2a2a] text-[#8c8c8c]" },
    halt: { label: "HALT", cls: "bg-amber-500/15 text-amber-300" },
  };
  const p = map[status] || map.skip;
  return <span className={cx("text-[9px] font-bold px-1.5 py-0.5 rounded", p.cls)}>{p.label}</span>;
}

export const MiniBacktestCycleTable = memo(function MiniBacktestCycleTable({ rows = [], futures = false }) {
  if (!rows.length) {
    return (
      <div className="text-[12px] text-[#8c8c8c] py-6 text-center">No cycle rows</div>
    );
  }

  return (
    <div className="overflow-auto max-h-[480px] rounded-lg border border-[rgba(60,40,80,0.35)]">
      <table className="w-full text-[11px] font-mono">
        <thead className="sticky top-0 bg-[#170f29] z-10">
          <tr className="text-[9px] uppercase tracking-wide text-[#8c8c8c]">
            <th className="text-center py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">#</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Status</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Dur(c)</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">tMFE</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">tMAE</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">P0</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">P_exit</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Exit%</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">MAE%</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Stake</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Gross</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Fees</th>
            {futures && <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Funding</th>}
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Net</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">→Reserve</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Tradable</th>
            <th className="text-right py-2 px-2 border-b border-[rgba(60,40,80,0.45)]">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const c = row.c;
            if (row.status === "halt" || row.status === "skip") {
              return (
                <tr key={`${c.id}-${row.status}`} className="opacity-50 text-[#8c8c8c]">
                  <td className="text-center py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)]">{c.id}</td>
                  <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)]">
                    <StatusPill status={row.status} />
                  </td>
                  <td colSpan={futures ? 15 : 14} className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-left">
                    {row.status === "halt" ? "stopout / ruin — no further cycles" : "no tradable capital"}
                  </td>
                </tr>
              );
            }

            const ex = (c.P_exit / c.P0 - 1) * 100;
            return (
              <tr key={c.id} className="text-[#d9d9d9]">
                <td className="text-center py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)]">{c.id}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">
                  <StatusPill status={row.status} />
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{c.duration_candles}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{c.idx_mfe - 1}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{c.idx_mae - 1}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{c.P0.toLocaleString()}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{c.P_exit.toFixed(0)}</td>
                <td className={cx("py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right", ex >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatMbPct(ex)}
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right text-red-400">
                  {c.mae_pct.toFixed(2)}%
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{formatMbMoney(row.stake)}</td>
                <td className={cx("py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right", row.gross >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatMbMoney(row.gross)}
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right text-red-400">
                  {formatMbMoney(-row.tradeFees)}
                </td>
                {futures && (
                  <td className={cx("py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right", row.funding > 0 ? "text-red-400" : "text-emerald-400")}>
                    {row.funding ? formatMbMoney(-row.funding) : "—"}
                  </td>
                )}
                <td className={cx("py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right", row.net >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatMbMoney(row.net)}
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right text-teal-400">
                  {row.skim > 0 ? formatMbMoney(row.skim) : "—"}
                </td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{formatMbMoney(row.tradable)}</td>
                <td className="py-1.5 px-2 border-b border-[rgba(60,40,80,0.2)] text-right">{formatMbMoney(row.equity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
