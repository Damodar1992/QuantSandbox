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
import { BtValueTooltip } from "./BtInfoTooltip";

/**
 * The Level 0 core-metrics cell: six metrics side by side, each with Δ% against
 * the mini underneath. Δ is absent for standalone runs.
 */
export const BtCoreMetricsCell = memo(function BtCoreMetricsCell({ core, miniCore }) {
  if (!core) return <span className={BT_MUTED}>—</span>;

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
      {BT_CORE_METRICS.map((metric) => {
        const value = core[metric.key];
        const delta = miniCore ? deltaVsMini(value, miniCore[metric.key]) : null;
        const hasMini = Boolean(miniCore);
        return (
          <div key={metric.key} className="min-w-[62px]">
            <div className="text-[9px] uppercase tracking-wide text-[#8c8c8c]">{metric.label}</div>
            <div>
              <BtValueTooltip text={metric.description} formula={metric.formula}>
                <span
                  className={cx("font-mono tabular-nums text-[11px]", coreMetricTone(metric.key, value))}
                >
                  {fmtCoreMetric(metric.key, value)}
                </span>
              </BtValueTooltip>
            </div>
            {hasMini ? (
              <div>
                <BtValueTooltip text={delta === null ? BT_TOOLTIPS.naDivZero : BT_TOOLTIPS.delta}>
                  <span
                    className={cx(
                      "font-mono tabular-nums text-[9px]",
                      delta === null ? BT_MUTED : signedTone(delta),
                    )}
                  >
                    {delta === null ? "N/A" : `Δ ${fmtPct(delta, 1, true)}`}
                  </span>
                </BtValueTooltip>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
