import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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

const TH_GROUP =
  "px-2.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4] border-b border-[rgba(60,40,80,0.35)] bg-[#161022]";
const TH_METRIC =
  "px-2.5 py-2 text-center text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c] border-b border-[rgba(60,40,80,0.35)] bg-[#19102b] align-bottom leading-snug whitespace-normal min-w-[132px] max-w-[168px]";
const TD =
  "px-2.5 py-2 text-center align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const GROUP_SEP = "border-l border-[rgba(60,40,80,0.35)]";
const PERIOD_ROW = "bg-[#19102b]";

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

function PeriodMetrics({ sections }) {
  if (!sections.length) return null;

  return (
    <tr className="bg-[#0d0818]">
      <td className="p-0 align-top">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-collapse">
            <thead>
              <tr>
                {sections.map((section, index) => (
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
                {sections.flatMap((section, index) =>
                  section.rows.map((row, rowIndex) => (
                    <th
                      key={`${section.key}-${row.key}`}
                      className={cx(TH_METRIC, index > 0 && rowIndex === 0 && GROUP_SEP)}
                    >
                      <BtHeaderWithHelp label={row.label} tip={BT_TEMPORAL_TOOLTIPS[row.key]}>
                        {row.label}
                      </BtHeaderWithHelp>
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {sections.flatMap((section, index) =>
                  section.rows.map((row, rowIndex) => (
                    <td
                      key={`${section.key}-${row.key}`}
                      className={cx(
                        TD,
                        toneClass(row.tone),
                        index > 0 && rowIndex === 0 && GROUP_SEP,
                      )}
                    >
                      {row.total}
                    </td>
                  )),
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

export const TemporalSummaryTab = memo(function TemporalSummaryTab({ run }) {
  const temporal = useMemo(() => {
    if (run?.result?.temporal) return run.result.temporal;
    if (!run?.result?.core) return null;
    return buildTemporalSummary(run);
  }, [run]);

  const periodIds = useMemo(
    () => temporal?.periods?.map((period) => period.id) ?? [],
    [temporal],
  );
  const periodSignature = periodIds.join("|");

  const [expanded, setExpanded] = useState(() => new Set(["all"]));

  useEffect(() => {
    setExpanded(new Set(["all"]));
  }, [periodSignature]);

  const togglePeriod = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(periodIds));
  const collapseAll = () => setExpanded(new Set());

  if (!temporal?.periods?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No temporal summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
            Temporal metrics summary
          </div>
          <div className="inline-flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              className="rounded px-1.5 py-0.5 text-[10px] text-violet-300 hover:bg-[#1a1a1a]"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded px-1.5 py-0.5 text-[10px] text-violet-300 hover:bg-[#1a1a1a]"
            >
              Collapse all
            </button>
          </div>
        </div>
        <div className={cx("mb-3 text-[10px] leading-snug", ui.textSubtle)}>
          The same run broken down by period. Values are given on two axes:{" "}
          <strong className="font-semibold text-[#d9d9d9]">Tradable</strong> — the trading balance
          without the reserve, <strong className="font-semibold text-[#d9d9d9]">Equity</strong> —
          including open positions.
        </div>

        <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
          <table className="w-full border-collapse">
            <tbody>
              {temporal.periods.map((period) => {
                const isOpen = expanded.has(period.id);
                const sections = temporal.byPeriod?.[period.id]?.sections || [];
                return (
                  <React.Fragment key={period.id}>
                    <tr className={PERIOD_ROW}>
                      <td className="p-0">
                        <button
                          type="button"
                          onClick={() => togglePeriod(period.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? `Collapse ${period.label}` : `Expand ${period.label}`}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1f1633]"
                        >
                          <ChevronDown
                            className={cx(
                              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                            {period.label}
                          </span>
                        </button>
                      </td>
                    </tr>
                    {isOpen ? <PeriodMetrics sections={sections} /> : null}
                  </React.Fragment>
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
