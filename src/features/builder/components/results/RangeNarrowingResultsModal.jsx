import React, { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../../constants/ui";
import {
  computeCombinationsFromConfigRows,
  computeReductionStats,
} from "../../utils/rangeNarrowingMock";

function formatNumber(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

function formatPercent(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n > 0 && n < 0.01) return `${n.toFixed(4)}%`;
  if (n < 1) return `${n.toFixed(3)}%`;
  return `${n.toFixed(1)}%`;
}

function formatRemainingPercent(after, before) {
  if (before == null || !Number.isFinite(before) || before <= 0) return "—";
  return formatPercent((after / before) * 100);
}

function StatusBadge({ row }) {
  if (row.status === "fixed" || row.fixedValue != null) {
    const v = row.fixedValue ?? row.min;
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
        fixed @ {v}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-green-400">
      Active
    </span>
  );
}

function ImportanceBar({ value }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex items-center gap-2.5 w-full min-w-[180px] max-w-[240px]">
      <div className="relative flex-1 min-w-[100px] h-2.5 rounded-full bg-[#1a1a1a] border border-[#303030]/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-medium text-violet-300 tabular-nums min-w-[44px] text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function ConfigCell({ row, field }) {
  if (row.status === "fixed" || row.fixedValue != null) {
    if (field === "min") return <span className="text-amber-400">fixed @ {row.fixedValue}</span>;
    if (field === "max" || field === "step" || field === "count") return <span className="text-[#595959]">—</span>;
  }
  const val = row[field];
  return <span>{val != null ? val : "—"}</span>;
}

export const RangeNarrowingResultsModal = memo(function RangeNarrowingResultsModal({
  open,
  item,
  onClose,
  onApplyRanges,
}) {
  const results = item?.results;
  const runConfig = item?.runConfig;
  const hasMargin = Boolean(runConfig?.marginEnabled && results?.configs?.margin);
  const [activeConfigTab, setActiveConfigTab] = useState("main");

  const activeConfig = useMemo(() => {
    if (!results?.configs) return null;
    if (activeConfigTab === "margin" && results.configs.margin) return results.configs.margin;
    return results.configs.main;
  }, [results, activeConfigTab]);

  const marginWiden = runConfig?.marginWiden ?? results?.configs?.margin?.marginWiden ?? 0;

  const beforeCombinations = results?.beforeCombinations ?? 0;

  const afterCombinations = useMemo(
    () => computeCombinationsFromConfigRows(activeConfig?.configRows),
    [activeConfig],
  );

  const { absoluteReduction, reductionMultiplier } = useMemo(
    () => computeReductionStats(beforeCombinations, afterCombinations),
    [beforeCombinations, afterCombinations],
  );

  if (!open || !item || !results) return null;

  const {
    runId,
    targetMetric = "final_score",
  } = results;

  const handleApply = () => {
    const configRows = activeConfigTab === "margin" && results.configs.margin
      ? results.configs.margin.configRows
      : results.configs.main?.configRows;
    onApplyRanges?.(configRows, activeConfigTab);
    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className={cx(
          ui.radius,
          "bg-[#141414] border border-[#303030] max-w-[820px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-[#d9d9d9]">Range Narrowing — results</span>
            <span className="text-[11px] text-[#8c8c8c]">
              (run {runId}, target: {targetMetric} — fixed)
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">
            ✕
          </button>
        </div>

        <div className="overflow-auto p-4 flex-1 min-h-0 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-violet-300 tabular-nums">{formatNumber(beforeCombinations)}</div>
              <div className="text-[10px] text-[#8c8c8c] mt-1">before (broad run)</div>
            </div>
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-violet-300 tabular-nums">{formatNumber(afterCombinations)}</div>
              <div className="text-[10px] text-[#8c8c8c] mt-1">combinations in next run</div>
            </div>
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-emerald-400 tabular-nums">
                × {formatNumber(reductionMultiplier)}
              </div>
              <div className="text-[10px] text-[#8c8c8c] mt-1">
                smaller (−{formatNumber(absoluteReduction)}, {formatRemainingPercent(afterCombinations, beforeCombinations)} remaining)
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveConfigTab("main")}
              className={cx(
                "px-3 py-1.5 rounded-md text-[11px] border transition-colors",
                activeConfigTab === "main"
                  ? "border-violet-500/70 bg-violet-900/30 text-violet-200"
                  : "border-[#303030] text-[#8c8c8c] hover:text-[#d9d9d9]",
              )}
            >
              config «main»
            </button>
            {hasMargin ? (
              <button
                type="button"
                onClick={() => setActiveConfigTab("margin")}
                className={cx(
                  "px-3 py-1.5 rounded-md text-[11px] border transition-colors",
                  activeConfigTab === "margin"
                    ? "border-violet-500/70 bg-violet-900/30 text-violet-200"
                    : "border-[#303030] text-[#8c8c8c] hover:text-[#d9d9d9]",
                )}
              >
                config «margin» (+{marginWiden} steps)
              </button>
            ) : null}
          </div>

          {activeConfig ? (
            <>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">Importance &amp; response curve</div>
                <div className="overflow-x-auto border border-[#303030] rounded-lg">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Indicator</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Parameter</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-[30%] min-w-[200px]">Importance</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#d9d9d9]">
                      {(activeConfig.importanceRows || []).map((row) => (
                        <tr key={`${row.indicator}-${row.parameter}`} className="border-b border-[#303030]/60">
                          <td className="px-3 py-2">{row.indicator}</td>
                          <td className="px-3 py-2 font-mono text-[#a6a6a6]">{row.parameter}</td>
                          <td className="px-3 py-2 align-middle">
                            <ImportanceBar value={row.importance} />
                          </td>
                          <td className="px-3 py-2 text-green-400">
                            <StatusBadge row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">
                  Config — «{activeConfigTab}»
                </div>
                <div className="overflow-x-auto border border-[#303030] rounded-lg">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Indicator</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Parameter</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Min</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Max</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Step</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Count</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#d9d9d9]">
                      {(activeConfig.configRows || []).map((row) => (
                        <tr key={`cfg-${row.indicator}-${row.parameter}`} className="border-b border-[#303030]/60">
                          <td className="px-3 py-2">{row.indicator}</td>
                          <td className="px-3 py-2 font-mono text-[#a6a6a6]">{row.parameter}</td>
                          <td className="px-3 py-2"><ConfigCell row={row} field="min" /></td>
                          <td className="px-3 py-2"><ConfigCell row={row} field="max" /></td>
                          <td className="px-3 py-2"><ConfigCell row={row} field="step" /></td>
                          <td className="px-3 py-2"><ConfigCell row={row} field="count" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
            Close
          </button>
          <button type="button" onClick={handleApply} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>
            Apply ranges to strategy
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
