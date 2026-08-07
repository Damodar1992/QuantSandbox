import React, { memo } from "react";
import { cx } from "@/constants/ui";
import { BT_CORE_METRICS, BT_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_MUTED,
  coreMetricTone,
  deltaVsMini,
  fmtCoreMetric,
  fmtPct,
  signedTone,
} from "../utils/format";
import { BtHeaderWithHelp, BtValueTooltip } from "./BtInfoTooltip";

const TH =
  "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] whitespace-nowrap text-[#8c8c8c]";
const TD = "px-3 py-2 whitespace-nowrap font-mono tabular-nums text-right";
const ROW = "border-b border-[rgba(60,40,80,0.22)] last:border-b-0";

/**
 * Core metrics compare table: METRIC · BACKTEST · MINI-BACKTEST · Δ (BT VS MINI).
 * Matches the Level-0 expanded “Core metrics” block.
 */
export const CoreMetricsCompareTable = memo(function CoreMetricsCompareTable({
  core,
  miniCore,
}) {
  const hasMini = Boolean(miniCore);

  if (!core) {
    return (
      <div className="px-3 py-4 text-center text-[11px] text-[#8c8c8c]">
        No core metrics yet — run must finish successfully.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="bg-[#19102b]">
          <tr>
            <th className={TH}>Metric</th>
            <th className={cx(TH, "text-right")}>Backtest</th>
            <th className={cx(TH, "text-right")}>Mini-backtest</th>
            <th className={cx(TH, "text-right")}>
              <span className="inline-flex w-full justify-end">
                <BtHeaderWithHelp label="Δ" text={BT_TOOLTIPS.delta}>
                  Δ (BT vs mini)
                </BtHeaderWithHelp>
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {BT_CORE_METRICS.map((metric) => {
            const value = core[metric.key];
            const miniValue = hasMini ? miniCore[metric.key] : null;
            const delta = hasMini ? deltaVsMini(value, miniValue) : null;
            return (
              <tr key={metric.key} className={ROW}>
                <td className="px-3 py-2 text-left">
                  <BtValueTooltip text={metric.description} formula={metric.formula}>
                    <span className="underline decoration-dotted underline-offset-2 decoration-[#6e6682]">
                      {metric.label}
                    </span>
                  </BtValueTooltip>
                </td>
                <td className={cx(TD, coreMetricTone(metric.key, value))}>
                  {fmtCoreMetric(metric.key, value)}
                </td>
                <td className={cx(TD, "text-[#b8aecc]")}>
                  {hasMini ? fmtCoreMetric(metric.key, miniValue) : <span className={BT_MUTED}>—</span>}
                </td>
                <td className={cx(TD, !hasMini || delta === null ? BT_MUTED : signedTone(delta))}>
                  {!hasMini ? "—" : delta === null ? "N/A" : fmtPct(delta, 1, true)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
