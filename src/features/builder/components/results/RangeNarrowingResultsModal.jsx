import React, { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx, ui } from "../../../../constants/ui";
import {
  computeCombinationsFromConfigRows,
  computeReductionStats,
} from "../../utils/rangeNarrowingMock";

const TOOLTIPS = {
  importanceCurve:
    "Response curve = the average final score for every tested value of the parameter, built from the broad run. Importance = share of the total final score variation explained by the parameter; computed automatically, not set manually. High importance → strongly drives the score, keeps a range. Low importance → its value barely matters, fixed at its best value. Note: importance is measured per parameter independently — interactions between parameters are not modeled.",
  main: {
    min: "Lower boundary of the kept range — the continuous top-scoring zone around the best value (set by Plateau width). The best tested value is always inside the range. Values below this boundary scored under the cutoff, were tested on too few epochs, or are separated from the peak by a dip.",
    max: "Upper boundary of the kept range — the continuous top-scoring zone around the best value (set by Plateau width). Values above this boundary scored under the cutoff, were tested on too few epochs, or are separated from the peak by a dip.",
    step: "Suggested step for the next run. Always a multiple of the original grid step and never finer. It may be coarser than the original when the range is wide and the combination budget is tight.",
    count: "How many values of this parameter the next run will test. Product of Counts over active parameters = total combinations.",
  },
  margin: {
    step: "Suggested step for the next run. Always a multiple of the original grid step and never finer. It may be coarser than the original when the range is wide and the combination budget is tight.",
    count: "How many values of this parameter the next run will test. Product of Counts over active parameters = total combinations.",
  },
};

function buildMarginConfigTooltips(widen) {
  const steps = Number.isFinite(widen) ? widen : 2;
  return {
    min: `Lower boundary of the «main» range extended down by ${steps} grid steps of this parameter. If the extension goes below the values tested in the broad run, the boundary is clamped to the tested minimum.`,
    max: `Upper boundary of the «main» range extended up by ${steps} grid steps of this parameter. If the extension goes above the values tested in the broad run, the boundary is clamped to the tested maximum.`,
    step: TOOLTIPS.margin.step,
    count: TOOLTIPS.margin.count,
  };
}

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

function formatTargetMetric(metric) {
  if (!metric) return "final score";
  return String(metric).replace(/_/g, " ");
}

function isFixedRow(row) {
  return row.status === "fixed" || row.fixedValue != null;
}

function buildNextRunCombinationsTooltip(configRows, total) {
  const counts = (configRows || [])
    .filter((row) => !isFixedRow(row))
    .map((row) => row.count)
    .filter((c) => c != null && Number.isFinite(c) && c >= 1);

  if (!counts.length) {
    return "Product of Count over active parameters. Fixed parameters do not multiply the total.";
  }

  const product = counts.reduce((acc, c) => acc * c, 1);
  const shown = Number.isFinite(total) ? total : product;
  return `Product of Count over active parameters: ${counts.join(" × ")} = ${shown}. Fixed parameters do not multiply the total.`;
}

function FieldHelpTooltip({ text, label }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 text-violet-400 hover:text-violet-300"
          aria-label={`Help: ${label}`}
          onClick={(e) => e.preventDefault()}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-[320px] text-[11px] leading-snug whitespace-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusBadge({ row }) {
  if (isFixedRow(row)) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
        Fixed
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
    <div className="flex items-center gap-2.5 w-full min-w-[160px] max-w-[240px]">
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

function HeaderWithHelp({ children, label, text }) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <FieldHelpTooltip label={label} text={text} />
    </span>
  );
}

export const RangeNarrowingResultsModal = memo(function RangeNarrowingResultsModal({
  open,
  item,
  onClose,
  onApplyRanges,
  onRunHyperopt,
}) {
  const results = item?.results;
  const runConfig = item?.runConfig;
  const hasMargin = Boolean(runConfig?.marginEnabled && results?.configs?.margin);
  const [activeConfigTab, setActiveConfigTab] = useState("main");

  useEffect(() => {
    if (open) setActiveConfigTab("main");
  }, [open, item?.id]);

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

  const { reductionMultiplier } = useMemo(
    () => computeReductionStats(beforeCombinations, afterCombinations),
    [beforeCombinations, afterCombinations],
  );

  const nextRunTooltip = useMemo(
    () => buildNextRunCombinationsTooltip(activeConfig?.configRows, afterCombinations),
    [activeConfig, afterCombinations],
  );

  const configColumnTooltips = useMemo(
    () =>
      activeConfigTab === "margin"
        ? buildMarginConfigTooltips(marginWiden)
        : TOOLTIPS.main,
    [activeConfigTab, marginWiden],
  );

  if (!open || !item || !results) return null;

  const { targetMetric = "final_score" } = results;
  const remainingOfBroad = formatPercent(
    beforeCombinations > 0 ? (afterCombinations / beforeCombinations) * 100 : null,
  );

  const handleApply = () => {
    const configRows =
      activeConfigTab === "margin" && results.configs.margin
        ? results.configs.margin.configRows
        : results.configs.main?.configRows;
    onApplyRanges?.(configRows, activeConfigTab);
    onClose?.();
  };

  const handleRunHyperopt = () => {
    const configRows =
      activeConfigTab === "margin" && results.configs.margin
        ? results.configs.margin.configRows
        : results.configs.main?.configRows;
    onRunHyperopt?.(configRows, activeConfigTab);
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
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#303030]">
          <div className="min-w-0 space-y-1">
            <div className="text-[15px] font-semibold text-[#d9d9d9]">
              Parameter Importance &amp; Range Narrowing — results
            </div>
            <div className="text-[11px] text-[#8c8c8c]">
              Target metric: {formatTargetMetric(targetMetric)}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1 shrink-0">
            ✕
          </button>
        </div>

        <div className="overflow-auto p-4 flex-1 min-h-0 space-y-4">
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
                config «margin» (+{marginWiden} grid steps per side)
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-[#d9d9d9] tabular-nums">
                {formatNumber(beforeCombinations)}
              </div>
              <div className="text-[10px] text-[#8c8c8c] mt-1">combinations in the broad run</div>
            </div>
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-[#d9d9d9] tabular-nums">
                {formatNumber(afterCombinations)}
              </div>
              <div className="mt-1 inline-flex items-center justify-center gap-1 text-[10px] text-[#8c8c8c]">
                <span>combinations in the next run</span>
                <FieldHelpTooltip label="combinations in the next run" text={nextRunTooltip} />
              </div>
            </div>
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-semibold text-[#d9d9d9] tabular-nums">
                × {formatNumber(reductionMultiplier)}
              </div>
              <div className="text-[10px] text-[#8c8c8c] mt-1">
                smaller ({remainingOfBroad} of the broad run)
              </div>
            </div>
          </div>

          {activeConfig ? (
            <>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-[#d9d9d9]">
                  <span>Importance &amp; response curve</span>
                  <FieldHelpTooltip label="Importance & response curve" text={TOOLTIPS.importanceCurve} />
                </div>
                <div className="overflow-x-auto border border-[#303030] rounded-lg">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Indicator</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Parameter</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-[30%] min-w-[200px]">
                          Importance
                        </th>
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
                          <td className="px-3 py-2">
                            <StatusBadge row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-[10px] text-[#8c8c8c] leading-snug">
                  <span className="text-green-400 font-medium">Active</span>
                  {" = above the importance threshold, keeps a range. "}
                  <span className="text-amber-400 font-medium">Fixed</span>
                  {" = below the threshold, locked to its best value."}
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
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                          <HeaderWithHelp label="Min" text={configColumnTooltips.min}>
                            Min
                          </HeaderWithHelp>
                        </th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                          <HeaderWithHelp label="Max" text={configColumnTooltips.max}>
                            Max
                          </HeaderWithHelp>
                        </th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                          <HeaderWithHelp label="Step" text={configColumnTooltips.step}>
                            Step
                          </HeaderWithHelp>
                        </th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                          <HeaderWithHelp label="Count" text={configColumnTooltips.count}>
                            Count
                          </HeaderWithHelp>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-[#d9d9d9]">
                      {(activeConfig.configRows || []).map((row) => {
                        const fixed = isFixedRow(row);
                        return (
                          <tr
                            key={`cfg-${row.indicator}-${row.parameter}`}
                            className="border-b border-[#303030]/60"
                          >
                            <td className="px-3 py-2">{row.indicator}</td>
                            <td className="px-3 py-2 font-mono text-[#a6a6a6]">{row.parameter}</td>
                            <td className="px-3 py-2">{fixed ? 1 : (row.min ?? "—")}</td>
                            <td className="px-3 py-2">{fixed ? 1 : (row.max ?? "—")}</td>
                            <td className="px-3 py-2">{fixed ? 1 : (row.step ?? "—")}</td>
                            <td className="px-3 py-2">{fixed ? 1 : (row.count ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-100/90 leading-snug">
            <strong className="text-amber-300">Review steps before applying.</strong> Suggested steps are
            auto-computed to fit the combination limit and may be coarser than the original grid. After
            applying this config to the <strong className="text-amber-300">Indicator ranges</strong> block
            you can keep the suggested steps, or manually set them back to the original grid step for a
            finer search — at the cost of more combinations in the next run.
          </div>

          <div className="text-[11px] text-[#8c8c8c] leading-snug">
            Apply fills the Indicator ranges block with the currently selected config tab («main» or
            «margin») — fixed parameters are written as single values — and sets the Hyperoptimization
            parameters (Hyperopt Type, Exchange, Trading Mode, Pair, Timeframe, Time Range, Fold size)
            from the source run. Nothing starts automatically — you can edit everything before launching
            the next run, and re-run narrowing with different settings at any time.
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
            Close
          </button>
          <button type="button" onClick={handleRunHyperopt} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>
            Run hyperoptimization
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
