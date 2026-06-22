import React, { memo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import { MINI_BACKTEST_LABELS, MINI_BACKTEST_UNITS } from "../../../../constants/miniBacktest";
import { getStageLabel } from "../../utils/stageSelect";

function resolveEpochNumber(entry) {
  if (entry.epochNumber != null) return entry.epochNumber;
  const label = entry.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

function resolveStageLabel(entry) {
  if (entry.stageId != null) return getStageLabel(entry.stageId);
  if (entry.stage) {
    const s = String(entry.stage);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return "—";
}

/**
 * Summary table for all Mini Backtest results across epochs.
 * Rendered as a standalone BuilderSectionShell section.
 */
export const MiniBacktestSummaryTable = memo(function MiniBacktestSummaryTable({
  results = [],
  onViewDetails,
  onRemoveResult,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (results.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "p-4 text-[11px] text-center", ui.textMuted)}>
        No Mini Backtest results yet. Enable Mini Backtest in Favorite Epochs and run from an epoch card.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
          <tr>
            <th className="px-2 py-2 text-left font-medium border-b border-[#303030] w-6"></th>
            <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Stage</th>
            <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Hyperopt #</th>
            <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Analyzer #</th>
            <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Epoch #</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">PnL</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">ROI</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">Max DD</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">PF</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">Win Rate</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">Cycles</th>
            <th className="px-3 py-2 text-center font-medium border-b border-[#303030]">Stopped</th>
            <th className="px-3 py-2 text-right font-medium border-b border-[#303030]">Actions</th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {results.map((entry) => {
            const s = entry.result?.summary;
            if (!s) return null;
            const isOpen = expandedId === entry.id;
            const epochNumber = resolveEpochNumber(entry);
            const stageLabel = resolveStageLabel(entry);

            return (
              <React.Fragment key={entry.id}>
                <tr className="border-b border-[#303030]/60 hover:bg-[#141414]">
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                      className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? "▼" : "▶"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{stageLabel}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">
                      {entry.hyperoptNumber != null ? `#${entry.hyperoptNumber}` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">
                      {entry.analyzerNumber != null ? `#${entry.analyzerNumber}` : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">
                      {epochNumber != null ? `#${epochNumber}` : "—"}
                    </span>
                  </td>
                  <td className={cx("px-3 py-2 text-right font-mono", s.totalPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {s.totalPnL >= 0 ? "+" : ""}{s.totalPnL.toFixed(2)}
                  </td>
                  <td className={cx("px-3 py-2 text-right font-mono", s.roi >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {s.roi >= 0 ? "+" : ""}{s.roi.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-red-400">
                    {s.maxDrawdown.toFixed(2)}%
                  </td>
                  <td className={cx("px-3 py-2 text-right font-mono", s.profitFactor >= 1 ? "text-emerald-400" : "text-red-400")}>
                    {s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}
                  </td>
                  <td className={cx("px-3 py-2 text-right font-mono", s.winRate >= 50 ? "text-emerald-400" : "text-red-400")}>
                    {s.winRate.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {s.cyclesExecuted}/{entry.cycleData?.length || s.cyclesExecuted}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.stoppedOut ? (
                      <span className="text-red-400">Yes</span>
                    ) : (
                      <span className="text-[#595959]">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails?.(entry)}
                        className={cx(ui.btn, "h-6 px-1.5 text-[10px] whitespace-nowrap")}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveResult?.(entry.id)}
                        className={cx(ui.btn, "h-6 px-1.5 text-[10px] whitespace-nowrap text-red-400 border-red-500/60 hover:bg-red-500/10")}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={12} className="p-0 align-top bg-[#0f0f0f]">
                      <div className="p-3 space-y-2">
                        <div className="text-[10px] text-[#8c8c8c] font-medium">Parameters</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                          {Object.entries(entry.params || {}).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-[#8c8c8c]">{MINI_BACKTEST_LABELS[key] || key}:</span>
                              <span className="text-[#d9d9d9] font-mono">
                                {val}{MINI_BACKTEST_UNITS[key] ? ` ${MINI_BACKTEST_UNITS[key]}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-[#8c8c8c] font-medium pt-1">Epoch Metrics</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                          {entry.epochParams && Object.entries(entry.epochParams).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-[#8c8c8c]">{key}:</span>
                              <span className="text-[#d9d9d9] font-mono">
                                {typeof val === "number" ? val.toFixed(3) : val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
