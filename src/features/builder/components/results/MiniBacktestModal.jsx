import React, { memo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { getStageLabel } from "../../utils/stageSelect";
import { AppButton } from "../../../../components/common/AppButton";

export const MiniBacktestModal = memo(function MiniBacktestModal({
  epoch,
  existingResult,
  open,
  onClose,
  onSaveResult,
  onRemoveResult,
  launchStageId = 1,
}) {
  const [params, setParams] = useState(() =>
    existingResult ? { ...MINI_BACKTEST_DEFAULTS, ...existingResult.params } : { ...MINI_BACKTEST_DEFAULTS }
  );
  const [result, setResult] = useState(existingResult?.result || null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setParams(existingResult ? { ...MINI_BACKTEST_DEFAULTS, ...existingResult.params } : { ...MINI_BACKTEST_DEFAULTS });
      setResult(existingResult?.result || null);
    }
  }, [open, existingResult]);

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRun = useCallback(() => {
    setRunning(true);
    const cycleData = generateCycleDataForEpoch(epoch, params.cycleCount || 24);
    const backtestResult = runMiniBacktest(cycleData, params);
    setResult(backtestResult);

    const entry = {
      id: existingResult?.id || `mbt-${epoch.id}-${Date.now()}`,
      epochId: epoch.id,
      stageId: launchStageId,
      stage: getStageLabel(launchStageId),
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
  }, [epoch, params, existingResult, onSaveResult, launchStageId]);

  const handleRemove = useCallback(() => {
    setResult(null);
    onRemoveResult?.(epoch.id);
  }, [epoch.id, onRemoveResult]);

  if (!open) return null;

  const s = result?.summary;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div
        className={cx(
          "relative z-10 w-full max-w-lg mx-4 rounded-lg border shadow-xl",
          crmSurface.border,
          crmSurface.input,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div className="text-[13px] font-semibold text-[#f5f5f5]">Mini Backtest</div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] text-[18px] leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MINI_BACKTEST_PARAM_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-[10px] text-[#8c8c8c] mb-1">
                  {MINI_BACKTEST_LABELS[key]}
                  {MINI_BACKTEST_UNITS[key] ? ` (${MINI_BACKTEST_UNITS[key]})` : ""}
                </label>
                <input
                  type="number"
                  value={params[key]}
                  onChange={(e) => updateParam(key, Number(e.target.value))}
                  className={cx(ui.input, "h-8 px-2 text-[12px] w-full")}
                  min={0}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
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

          {/* Result */}
          {s && (
            <div className="border-t border-[#303030] pt-3">
              <div className="text-[10px] text-[#8c8c8c] mb-2">
                Result: {s.cyclesExecuted} cycles executed{s.stoppedOut ? " (stopped out)" : ""}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-[10px]">
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
      </div>
    </div>,
    document.body
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
