import { memo, useMemo } from "react";
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
import { BtValueTooltip } from "./BtInfoTooltip";

const TH_GROUP =
  "px-2.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4] border-b border-[rgba(60,40,80,0.35)] bg-[#161022]";
const TH_METRIC =
  "px-2.5 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c] border-b border-[rgba(60,40,80,0.35)] bg-[#19102b] align-bottom leading-snug whitespace-normal min-w-[132px] max-w-[168px]";
const TH_PERIOD = cx(
  TH_GROUP,
  "sticky left-0 z-20 min-w-[110px] text-left align-middle text-[#d9d9d9]",
);
const TD =
  "px-2.5 py-2 text-center align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const TD_PERIOD =
  "sticky left-0 z-10 bg-[#120b20] px-2.5 py-2 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-violet-200 whitespace-nowrap border-r border-[rgba(60,40,80,0.35)]";
const GROUP_SEP = "border-l border-[rgba(60,40,80,0.35)]";
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0 hover:bg-[#161022]/60";
const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

function MetricHeader({ label, tip }) {
  if (!tip?.text && !tip?.formula) return label;
  return (
    <BtValueTooltip text={tip.text} formula={tip.formula}>
      <span className={LABEL_DOTTED}>{label}</span>
    </BtValueTooltip>
  );
}

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

function metricLookup(sections) {
  const map = new Map();
  for (const section of sections || []) {
    for (const row of section.rows || []) {
      map.set(`${section.key}:${row.key}`, row);
    }
  }
  return map;
}

export const TemporalSummaryTab = memo(function TemporalSummaryTab({ run }) {
  const temporal = useMemo(() => {
    if (run?.result?.temporal) return run.result.temporal;
    if (!run?.result?.core) return null;
    return buildTemporalSummary(run);
  }, [run]);

  const templateSections = useMemo(() => {
    if (!temporal?.periods?.length) return [];
    const firstId = temporal.periods[0]?.id;
    return temporal.byPeriod?.[firstId]?.sections || temporal.byPeriod?.all?.sections || [];
  }, [temporal]);

  if (!temporal?.periods?.length || !templateSections.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No temporal summary for this run.
      </div>
    );
  }

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

        <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
          <table className="w-max min-w-full border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className={TH_PERIOD}>
                  Period
                </th>
                {templateSections.map((section, index) => (
                  <th
                    key={section.key}
                    colSpan={Math.max(1, section.rows.length)}
                    className={cx(TH_GROUP, index > 0 && GROUP_SEP)}
                    title={section.hint || undefined}
                  >
                    {section.title}
                  </th>
                ))}
              </tr>
              <tr>
                {templateSections.flatMap((section, index) =>
                  section.rows.map((row, rowIndex) => (
                    <th
                      key={`${section.key}-${row.key}`}
                      className={cx(TH_METRIC, index > 0 && rowIndex === 0 && GROUP_SEP)}
                    >
                      <MetricHeader label={row.label} tip={BT_TEMPORAL_TOOLTIPS[row.key]} />
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {temporal.periods.map((period) => {
                const lookup = metricLookup(temporal.byPeriod?.[period.id]?.sections);
                return (
                  <tr key={period.id} className={ROW}>
                    <td className={TD_PERIOD}>{period.label}</td>
                    {templateSections.flatMap((section, index) =>
                      section.rows.map((templateRow, rowIndex) => {
                        const row = lookup.get(`${section.key}:${templateRow.key}`) || templateRow;
                        return (
                          <td
                            key={`${period.id}-${section.key}-${templateRow.key}`}
                            className={cx(
                              TD,
                              toneClass(row.tone),
                              index > 0 && rowIndex === 0 && GROUP_SEP,
                            )}
                          >
                            {row.total ?? "—"}
                          </td>
                        );
                      }),
                    )}
                  </tr>
                );
              })}
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
