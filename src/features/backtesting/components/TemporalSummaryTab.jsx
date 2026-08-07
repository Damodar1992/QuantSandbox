import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { BT_TEMPORAL_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_DRAWDOWN,
  BT_MUTED,
  BT_NEGATIVE,
  BT_NEUTRAL,
  BT_POSITIVE,
} from "../utils/format";
import { buildTemporalSummary } from "../utils/temporalSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";

const TH =
  "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c]";
const TD = "px-3 py-2 align-middle text-[11px] font-mono tabular-nums";
const SECTION_ROW = "bg-[#161022]";

function toneClass(tone) {
  switch (tone) {
    case "drawdown-text":
      return BT_DRAWDOWN;
    case "neg-text":
      return BT_NEGATIVE;
    case "pos-text":
      return BT_POSITIVE;
    case "neutral-text":
    default:
      return BT_NEUTRAL;
  }
}

export const TemporalSummaryTab = memo(function TemporalSummaryTab({ run }) {
  const temporal = useMemo(() => {
    if (run?.result?.temporal) return run.result.temporal;
    if (!run?.result?.core) return null;
    return buildTemporalSummary(run);
  }, [run]);

  const [periodId, setPeriodId] = useState(temporal?.defaultPeriodId || "all");

  useEffect(() => {
    if (!temporal) return;
    const exists = temporal.periods.some((p) => p.id === periodId);
    if (!exists) setPeriodId(temporal.defaultPeriodId || temporal.periods[0]?.id || "all");
  }, [temporal, periodId]);

  if (!temporal?.periods?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No temporal summary for this run.
      </div>
    );
  }

  const periodData = temporal.byPeriod?.[periodId] || temporal.byPeriod?.all;
  const sections = periodData?.sections || [];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Temporal metrics summary
        </div>
        <div className={cx("mb-3 text-[10px] leading-snug", ui.textSubtle)}>
          The same run broken down by period. Values are given on two axes:{" "}
          <strong className="font-semibold text-[#d9d9d9]">Tradable</strong> — the trading balance
          without the reserve, <strong className="font-semibold text-[#d9d9d9]">Equity</strong> —
          including open positions.
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {temporal.periods.map((period) => {
            const active = period.id === periodId;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => setPeriodId(period.id)}
                className={cx(
                  "rounded-md border px-2.5 py-1 text-[11px] transition-colors",
                  active
                    ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                    : "border-[rgba(60,40,80,0.4)] bg-[#120b20] text-[#8c8c8c] hover:border-violet-400/30 hover:text-[#d9d9d9]",
                )}
              >
                {period.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
          <table className="w-full border-collapse">
            <thead className="bg-[#19102b]">
              <tr>
                <th className={cx(TH, "min-w-[240px]")}>Metric</th>
                <th className={cx(TH, "min-w-[140px]")}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <React.Fragment key={section.key}>
                  <tr className={SECTION_ROW}>
                    <td colSpan={2} className="px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
                        {section.title}
                      </div>
                      {section.hint ? (
                        <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>
                          {section.hint}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr
                      key={`${section.key}-${row.key}`}
                      className="border-b border-[rgba(60,40,80,0.22)] last:border-b-0"
                    >
                      <td className={cx(TD, "font-sans font-medium text-[#faf7fd]")}>
                        <BtHeaderWithHelp label={row.label} tip={BT_TEMPORAL_TOOLTIPS[row.key]}>
                          {row.label}
                        </BtHeaderWithHelp>
                      </td>
                      <td className={cx(TD, toneClass(row.tone))}>{row.total}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cx("mt-2 text-[10px]", BT_MUTED)}>
          Values shown as Percentage | Absolute where both axes apply.
        </div>
      </div>
    </div>
  );
});
