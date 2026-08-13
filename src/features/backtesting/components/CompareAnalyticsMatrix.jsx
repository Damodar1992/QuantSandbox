import React, { memo, useMemo } from "react";
import { cx } from "@/constants/ui";
import { BT_CORE_METRICS, BT_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_MUTED,
  coreMetricTone,
  deltaVsMini,
  fmtCoreMetric,
  fmtPct,
  percentileTone,
  signedTone,
} from "../utils/format";
import { BtHeaderWithHelp, BtValueTooltip } from "./BtInfoTooltip";

const TH =
  "px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c] border-b border-[rgba(60,40,80,0.35)] whitespace-nowrap";
const TH_GROUP =
  "px-2.5 py-2 text-center border-b border-[rgba(60,40,80,0.35)] align-bottom";
const TD = "px-2.5 py-1.5 text-center font-mono tabular-nums whitespace-nowrap text-[11px]";
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0";
const GROUP_SEP = "border-l border-[rgba(60,40,80,0.35)]";

function fmtMatrixValue(metricKey, value) {
  const base = fmtCoreMetric(metricKey, value);
  if (base === "—" || base === "N/A") return base;
  if (metricKey === "pnl") return `${base} USDT`;
  return base;
}

function fmtPctCell(value) {
  if (value == null || value === "" || value === "N/A") return "N/A";
  return fmtPct(value, 0);
}

function coreByKey(listOrMap) {
  if (!listOrMap) return {};
  if (Array.isArray(listOrMap)) {
    const out = {};
    for (const row of listOrMap) {
      if (row?.metric) out[row.metric] = row;
    }
    return out;
  }
  return listOrMap;
}

/**
 * Three-line validation matrix: Backtest · Shuffler · Synthetic.
 * Matches the Compare analytics reference layout.
 */
export const CompareAnalyticsMatrix = memo(function CompareAnalyticsMatrix({
  backtest,
  shufflerRun,
  syntheticRun,
}) {
  const model = useMemo(() => {
    const btCore = backtest?.result?.core || {};
    const miniCore = backtest?.miniCore || null;
    const shMap = coreByKey(shufflerRun?.result?.core);
    const syMap = coreByKey(syntheticRun?.result?.core);

    return {
      rows: BT_CORE_METRICS.map((metric) => {
        const bt = btCore[metric.key] ?? null;
        const mini = miniCore ? miniCore[metric.key] ?? null : null;
        const delta = miniCore ? deltaVsMini(bt, mini) : null;
        const sh = shMap[metric.key] || {};
        const sy = syMap[metric.key] || {};
        return {
          key: metric.key,
          label: metric.label,
          description: metric.description,
          formula: metric.formula,
          backtest: bt,
          mini,
          delta,
          shOriginal: sh.original ?? bt,
          shMean: sh.valid === false ? null : sh.mean ?? null,
          shMedian: sh.valid === false ? null : sh.median ?? null,
          shPct: sh.valid === false || sh.percentile === "N/A" ? "N/A" : sh.percentile ?? "N/A",
          syReal: sy.real ?? bt,
          syMean: sy.mean ?? null,
          syMedian: sy.median ?? null,
          syPct: sy.percentile ?? "N/A",
          hasShuffler: Boolean(shufflerRun),
          hasSynthetic: Boolean(syntheticRun),
        };
      }),
    };
  }, [backtest, shufflerRun, syntheticRun]);

  if (!backtest?.result?.core) {
    return (
      <div className="px-3 py-4 text-center text-[11px] text-[#8c8c8c]">
        No backtest metrics yet — run must finish successfully.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-[11px]">
        <thead className="bg-[#19102b]">
          <tr>
            <th rowSpan={2} className={cx(TH, "text-left align-middle w-[120px]")}>
              Metric
            </th>
            <th colSpan={3} className={cx(TH_GROUP, GROUP_SEP)}>
              <div className="text-[12px] font-semibold normal-case tracking-normal text-[#faf7fd]">
                Backtest
              </div>
            </th>
            <th colSpan={4} className={cx(TH_GROUP, GROUP_SEP)}>
              <div className="text-[12px] font-semibold normal-case tracking-normal text-[#faf7fd]">
                Shuffler
              </div>
            </th>
            <th colSpan={4} className={cx(TH_GROUP, GROUP_SEP)}>
              <div className="text-[12px] font-semibold normal-case tracking-normal text-[#faf7fd]">
                Synthetic
              </div>
            </th>
          </tr>
          <tr>
            <th className={cx(TH, "text-center", GROUP_SEP)}>Backtest</th>
            <th className={cx(TH, "text-center")}>Mini</th>
            <th className={cx(TH, "text-center")}>
              <BtHeaderWithHelp label="Δ%" text={BT_TOOLTIPS.delta}>
                Δ%
              </BtHeaderWithHelp>
            </th>
            <th className={cx(TH, "text-center", GROUP_SEP)}>Original</th>
            <th className={cx(TH, "text-center")}>Mean</th>
            <th className={cx(TH, "text-center")}>Median</th>
            <th className={cx(TH, "text-center")}>
              <BtHeaderWithHelp label="Pct" text={BT_TOOLTIPS.percentile}>
                Pct
              </BtHeaderWithHelp>
            </th>
            <th className={cx(TH, "text-center", GROUP_SEP)}>Original</th>
            <th className={cx(TH, "text-center")}>Mean</th>
            <th className={cx(TH, "text-center")}>Median</th>
            <th className={cx(TH, "text-center")}>
              <BtHeaderWithHelp label="Pct" text={BT_TOOLTIPS.percentile}>
                Pct
              </BtHeaderWithHelp>
            </th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {model.rows.map((row) => (
            <tr key={row.key} className={ROW}>
              <td className="px-2.5 py-1.5 text-left align-middle">
                <BtValueTooltip text={row.description} formula={row.formula}>
                  <span className="font-medium text-[#faf7fd] underline decoration-dotted decoration-[#6e6682] underline-offset-2">
                    {row.label}
                  </span>
                </BtValueTooltip>
              </td>

              <td className={cx(TD, GROUP_SEP, coreMetricTone(row.key, row.backtest))}>
                {fmtMatrixValue(row.key, row.backtest)}
              </td>
              <td className={cx(TD, "text-[#b8aecc]")}>
                {backtest?.miniCore ? (
                  fmtMatrixValue(row.key, row.mini)
                ) : (
                  <span className={BT_MUTED}>—</span>
                )}
              </td>
              <td
                className={cx(
                  TD,
                  !backtest?.miniCore || row.delta == null ? BT_MUTED : signedTone(row.delta),
                )}
              >
                {!backtest?.miniCore
                  ? "—"
                  : row.delta == null
                    ? "N/A"
                    : fmtPct(row.delta, 0, true)}
              </td>

              <td
                className={cx(
                  TD,
                  GROUP_SEP,
                  row.hasShuffler ? coreMetricTone(row.key, row.shOriginal) : BT_MUTED,
                )}
              >
                {row.hasShuffler ? fmtMatrixValue(row.key, row.shOriginal) : "—"}
              </td>
              <td className={cx(TD, "text-[#b8aecc]")}>
                {row.hasShuffler && row.shMean != null ? (
                  fmtMatrixValue(row.key, row.shMean)
                ) : (
                  <span className={BT_MUTED}>{row.hasShuffler ? "N/A" : "—"}</span>
                )}
              </td>
              <td className={cx(TD, "text-[#b8aecc]")}>
                {row.hasShuffler && row.shMedian != null ? (
                  fmtMatrixValue(row.key, row.shMedian)
                ) : (
                  <span className={BT_MUTED}>{row.hasShuffler ? "N/A" : "—"}</span>
                )}
              </td>
              <td
                className={cx(
                  TD,
                  row.hasShuffler && row.shPct !== "N/A"
                    ? percentileTone(row.shPct)
                    : BT_MUTED,
                )}
              >
                {row.hasShuffler ? fmtPctCell(row.shPct) : "—"}
              </td>

              <td
                className={cx(
                  TD,
                  GROUP_SEP,
                  row.hasSynthetic ? coreMetricTone(row.key, row.syReal) : BT_MUTED,
                )}
              >
                {row.hasSynthetic ? fmtMatrixValue(row.key, row.syReal) : "—"}
              </td>
              <td className={cx(TD, "text-[#b8aecc]")}>
                {row.hasSynthetic && row.syMean != null ? (
                  fmtMatrixValue(row.key, row.syMean)
                ) : (
                  <span className={BT_MUTED}>{row.hasSynthetic ? "N/A" : "—"}</span>
                )}
              </td>
              <td className={cx(TD, "text-[#b8aecc]")}>
                {row.hasSynthetic && row.syMedian != null ? (
                  fmtMatrixValue(row.key, row.syMedian)
                ) : (
                  <span className={BT_MUTED}>{row.hasSynthetic ? "N/A" : "—"}</span>
                )}
              </td>
              <td
                className={cx(
                  TD,
                  row.hasSynthetic && row.syPct !== "N/A"
                    ? percentileTone(row.syPct)
                    : BT_MUTED,
                )}
              >
                {row.hasSynthetic ? fmtPctCell(row.syPct) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

/** Resolve Compare lines: only starred (selectedForValidation) runs fill the matrix. */
export function resolveCompareCombination(run) {
  if (!run) return { shufflerRun: null, syntheticRun: null };

  const shufflerRun =
    (run.shufflerRuns || []).find((r) => r.selectedForValidation) || null;
  const syntheticRun =
    (run.syntheticRuns || []).find((r) => r.selectedForValidation) || null;

  return { shufflerRun, syntheticRun };
}
