import React, { memo, useState, useCallback } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import {
  MINI_BACKTEST_DEFAULTS,
  MINI_BACKTEST_LABELS,
  MINI_BACKTEST_UNITS,
  MINI_BACKTEST_PARAM_KEYS,
} from "../../../../constants/miniBacktest";
import { generateCycleDataForEpoch } from "../../utils/miniBacktestData";
import { runMiniBacktest, hashParams } from "../../utils/miniBacktestEngine";
import { AppButton } from "../../../../components/common/AppButton";

/**
 * Mini Backtest Panel — form + result for a single epoch.
 * Embedded inside Favorite Epochs card.
 */
export const MiniBacktestPanel = memo(function MiniBacktestPanel({
  epoch,
  onSaveResult,
  existingResult,
  onRemoveResult,
}) {
  const [params, setParams] = useState(() =>
    existingResult ? { ...MINI_BACKTEST_DEFAULTS, ...existingResult.params } : { ...MINI_BACKTEST_DEFAULTS }
  );
  const [result, setResult] = useState(existingResult?.result || null);
  const [cycles, setCycles] = useState(existingResult?.cycleData || null);
  const [running, setRunning] = useState(false);

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRun = useCallback(() => {
    setRunning(true);
    const { meta, cycles: cycleData } = generateCycleDataForEpoch(epoch, params.cycleCount || 24);
    const backtestResult = runMiniBacktest(cycleData, params, meta);
    setCycles(cycleData);
    setResult(backtestResult);

    const entry = {
      id: existingResult?.id || `mbt-${epoch.id}-${Date.now()}`,
      epochId: epoch.id,
      stage: epoch.stage || "signal",
      hyperoptNumber: epoch.hyperoptNumber ?? epoch.meta?.hyperoptNumber ?? null,
      analyzerNumber: epoch.analyzerNumber ?? epoch.meta?.analyzerNumber ?? null,
      hyperoptId: epoch.meta?.rowId || epoch.hyperoptId || "",
      analyzerId: epoch.meta?.subId || epoch.analyzerId || "",
      epochNumber: epoch.epochNumber ?? null,
      epochLabel: epoch.label || "Best result",
      epochParams: { mfe: epoch.mfe, mae: epoch.mae, air: epoch.air, hitRate: epoch.hitRate, score: epoch.score },
      cycleData,
      params: { ...params },
      paramsHash: hashParams(params),
      result: backtestResult,
      createdAt: new Date().toISOString(),
    };
    onSaveResult?.(entry);
    setRunning(false);
  }, [epoch, params, existingResult, onSaveResult]);

  const handleRemove = useCallback(() => {
    setResult(null);
    setCycles(null);
    onRemoveResult?.(epoch.id);
  }, [epoch.id, onRemoveResult]);

  const s = result?.summary;

  return (
    <div className={cx("rounded-lg border overflow-hidden mt-2", crmSurface.border, crmSurface.input)}>
      {/* Header */}
      <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-amber-500/10 text-amber-200 text-[11px]">
        Mini Backtest
      </div>

      {/* Parameters form */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MINI_BACKTEST_PARAM_KEYS.map((key) => (
            <div key={key}>
              <label className="block text-[10px] text-[#8c8c8c] mb-0.5">
                {MINI_BACKTEST_LABELS[key]}
                {MINI_BACKTEST_UNITS[key] ? ` (${MINI_BACKTEST_UNITS[key]})` : ""}
              </label>
              <input
                type="number"
                value={params[key]}
                onChange={(e) => updateParam(key, Number(e.target.value))}
                className={cx(ui.input, "h-7 px-2 text-[11px] w-full")}
                step={key === "fees" ? 0.01 : key.includes("Stake") || key === "reservedAmount" || key === "initialBalance" ? 1 : key === "stopout" || key === "relativeStakeAmount" ? 1 : 1}
                min={0}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <AppButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleRun}
            disabled={running}
          >
            {running ? "Running..." : "Run Mini Backtest"}
          </AppButton>
          {result && (
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-red-400 border-red-500/60 hover:bg-red-500/10"
            >
              Remove Result
            </AppButton>
          )}
        </div>
      </div>

      {/* Result */}
      {s && (
        <div className="border-t border-[#303030] p-3">
          <div className="text-[10px] text-[#8c8c8c] mb-2">
            Result: {s.cyclesExecuted} cycles executed{s.stoppedOut ? " (stopped out)" : ""}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[10px]">
            <MetricCell label="PnL" value={`${s.totalPnL >= 0 ? "+" : ""}${s.totalPnL.toFixed(2)}`} positive={s.totalPnL >= 0} />
            <MetricCell label="ROI" value={`${s.roi >= 0 ? "+" : ""}${s.roi.toFixed(2)}%`} positive={s.roi >= 0} />
            <MetricCell label="Max DD" value={`${s.maxDrawdown.toFixed(2)}%`} positive={false} />
            <MetricCell label="Profit Factor" value={s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)} positive={s.profitFactor >= 1} />
            <MetricCell label="Win Rate" value={`${s.winRate.toFixed(1)}%`} positive={s.winRate >= 50} />
            <MetricCell label="Wins / Losses" value={`${s.winCount} / ${s.lossCount}`} positive={s.winCount >= s.lossCount} />
            <MetricCell label="Total Fees" value={`${s.totalFees.toFixed(2)}`} positive={false} />
            <MetricCell label="Final Balance" value={`${s.finalBalance.toFixed(2)}`} positive={s.finalBalance >= s.initialBalance} />
          </div>
        </div>
      )}
    </div>
  );
});

function MetricCell({ label, value, positive }) {
  return (
    <div>
      <div className="text-[#8c8c8c]">{label}</div>
      <div className={cx("font-mono", positive ? "text-emerald-400" : "text-red-400")}>{value}</div>
    </div>
  );
}
