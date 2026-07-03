import React, { memo } from "react";
import { formatMbMoney, formatMbPct } from "../../utils/miniBacktestDisplay";

export const MiniBacktestRunStatus = memo(function MiniBacktestRunStatus({ result, params }) {
  const r = result?.summary;
  if (!r) return null;

  const total = r.totalCycles ?? r.execCount ?? 0;
  const ran = r.execCount ?? r.cyclesExecuted ?? 0;
  const futures = params?.marketType === "futures";
  const leverage = params?.leverage ?? 1;
  const exec = futures ? `${leverage}× leverage, ` : "";
  const fee = params?.orderType === "maker" ? params?.feeMaker : params?.feeTaker;
  const slippage = params?.orderType === "taker" ? params?.slippage : 0;
  const costs = `fees ${Number(fee ?? 0).toFixed(2)}%/side${slippage > 0 ? `, slippage ${Number(slippage).toFixed(2)}%` : ""}`;

  if (!r.halted && !r.stoppedOut) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 flex items-start gap-3">
        <div className="text-[22px] leading-none">✓</div>
        <div>
          <div className="text-[13px] font-semibold text-emerald-200">Account survived the full epoch</div>
          <div className="text-[12px] text-[#b8aecc] mt-1">
            All {total} cycles executed — no stopout, no ruin. Final balance{" "}
            {formatMbMoney(r.equity ?? r.finalBalance)} ({formatMbPct(r.roiTotal ?? r.roi)}).
          </div>
        </div>
      </div>
    );
  }

  const pct = total > 0 ? ((ran / total) * 100).toFixed(0) : "0";
  const equity = r.equity ?? r.finalBalance;
  const reserve = r.reserve ?? 0;
  const haltReason = r.haltReason || (r.stoppedOut ? "stopout" : null);

  if (haltReason === "ruin") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 flex items-start gap-3">
        <div className="text-[22px] leading-none">⛔</div>
        <div>
          <div className="text-[13px] font-semibold text-red-200">
            Deposit wiped — account ruined at cycle #{r.haltAt} of {total}
          </div>
          <div className="text-[12px] text-[#b8aecc] mt-1 leading-relaxed">
            Only <b className="text-[#e8e0f0]">{ran} of {total}</b> cycles ran ({pct}%) before the tradable
            balance hit $0. Locked reserve left: {formatMbMoney(reserve)}. Under these settings ({exec}
            {costs}) the Hyper Opt edge would have <b className="text-[#e8e0f0]">blown the deposit</b> — the
            remaining {total - ran} cycles never got a chance to recover it.
          </div>
        </div>
      </div>
    );
  }

  const stopFloor =
    params?.stopoutMode === "pct"
      ? formatMbMoney((params?.initialBalance ?? 0) * ((params?.stopout ?? 0) / 100))
      : formatMbMoney(params?.stopout ?? 0);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 flex items-start gap-3">
      <div className="text-[22px] leading-none">⚠</div>
      <div>
        <div className="text-[13px] font-semibold text-amber-200">
          Stopout at cycle #{r.haltAt} of {total}
        </div>
        <div className="text-[12px] text-[#b8aecc] mt-1 leading-relaxed">
          Trading stopped — tradable balance fell to the <b className="text-[#e8e0f0]">{stopFloor}</b> floor after{" "}
          <b className="text-[#e8e0f0]">{ran} of {total}</b> cycles ({pct}%). Final balance{" "}
          {formatMbMoney(equity)} (reserve {formatMbMoney(reserve)} protected). The remaining {total - ran}{" "}
          cycles never ran.
        </div>
      </div>
    </div>
  );
});
