import React, { memo, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_TEMPORAL_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_MUTED,
  fmtInt,
} from "../utils/format";
import { buildSyntheticTemporalSummary } from "../utils/syntheticTemporalSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";
import { PercentileCell } from "./SyntheticCoreResultsPanel";

const TH =
  "px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const TH_METRIC = cx(TH, "text-left min-w-[220px]");
const TH_NUM = cx(TH, "text-right");
const TH_PCT = cx(TH, "text-left min-w-[140px]");
const TD_NUM = cx(TD, "text-right");
const SECTION_ROW = "bg-[#161022]";

function MetricsVisibilityControl({ rows, enabledKeys, onChange }) {
  const total = rows.length;
  const visible = enabledKeys.size;

  const toggle = (key) => {
    const next = new Set(enabledKeys);
    if (next.has(key)) {
      if (next.size <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set(rows.map((r) => r.key)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          title="Show / hide metrics"
          aria-label="Show or hide metrics"
          className={cx(
            "inline-flex items-center gap-1.5 rounded-md border border-[rgba(60,40,80,0.45)] bg-[#120b20] px-2 py-1",
            "text-[9px] uppercase tracking-wide text-[#b8aecc] hover:border-violet-500/40 hover:text-violet-200",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {visible}/{total}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[300px] border-[rgba(60,40,80,0.45)] bg-[#170f29] p-1.5 shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[#6e6682]">Metrics</span>
          <button
            type="button"
            onClick={selectAll}
            className="rounded px-1.5 py-0.5 text-[10px] text-violet-300 hover:bg-[#1a1a1a]"
          >
            Select all
          </button>
        </div>
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {rows.map((row) => {
            const checked = enabledKeys.has(row.key);
            return (
              <label
                key={row.key}
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]",
                  checked && "bg-violet-500/10 text-violet-200",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(row.key)}
                  className="size-3.5 border-[#505050]"
                />
                <span className="truncate">{row.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SectionBlock({ section }) {
  const allKeys = useMemo(() => section.rows.map((r) => r.key), [section.rows]);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  const visibleRows = section.rows.filter((r) => enabledKeys.has(r.key));

  return (
    <React.Fragment>
      <tr className={SECTION_ROW}>
        <td colSpan={7} className="px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
                {section.title}
              </div>
              {section.hint ? (
                <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>
                  {section.hint}
                </div>
              ) : null}
            </div>
            <div className="inline-flex shrink-0 items-center gap-2">
              <span className={cx("text-[10px] uppercase tracking-wide", ui.textSubtle)}>
                {enabledKeys.size} metrics
              </span>
              <MetricsVisibilityControl
                rows={section.rows.map((r) => ({ key: r.key, label: r.label }))}
                enabledKeys={enabledKeys}
                onChange={setEnabledKeys}
              />
            </div>
          </div>
        </td>
      </tr>
      {visibleRows.map((row) => (
        <tr
          key={`${section.key}-${row.key}`}
          className="border-b border-[rgba(60,40,80,0.22)] last:border-b-0"
        >
          <td className={cx(TD, "font-sans font-medium text-[#faf7fd]")}>
            <span className="inline-flex items-center gap-1">
              <BtHeaderWithHelp label={row.label} tip={BT_TEMPORAL_TOOLTIPS[row.key]}>
                {row.label}
              </BtHeaderWithHelp>
              {row.star ? (
                <span className="text-amber-300" title="Star metric">
                  *
                </span>
              ) : null}
            </span>
          </td>
          <td className={cx(TD_NUM, "bg-sky-950/35 text-[#d9d9d9]")}>{row.original}</td>
          <td className={TD}>
            {row.textOnly || row.percentile == null ? (
              <span className={BT_MUTED}>—</span>
            ) : (
              <PercentileCell value={row.percentile} />
            )}
          </td>
          <td className={cx(TD_NUM, "text-[#d9d9d9]")}>
            {row.textOnly ? <span className={BT_MUTED}>—</span> : row.min}
          </td>
          <td className={cx(TD_NUM, "text-[#d9d9d9]")}>
            {row.textOnly ? <span className={BT_MUTED}>—</span> : row.median}
          </td>
          <td className={cx(TD_NUM, "text-[#d9d9d9]")}>
            {row.textOnly ? <span className={BT_MUTED}>—</span> : row.mean}
          </td>
          <td className={cx(TD_NUM, "text-[#d9d9d9]")}>
            {row.textOnly ? <span className={BT_MUTED}>—</span> : row.max}
          </td>
        </tr>
      ))}
      {!visibleRows.length ? (
        <tr>
          <td colSpan={7} className={cx("px-3 py-3 text-center text-[11px]", ui.textSubtle)}>
            No metrics selected
          </td>
        </tr>
      ) : null}
    </React.Fragment>
  );
}

/** Synthetic info → Temporal metrics (by period + distribution columns). */
export const SyntheticTemporalTab = memo(function SyntheticTemporalTab({ run, parentRun }) {
  const temporal = useMemo(
    () => buildSyntheticTemporalSummary(run, parentRun),
    [run, parentRun],
  );

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
            Temporal metrics summary
          </div>
          <div className={cx("mt-0.5 text-[10px]", ui.textSubtle)}>{temporal.subtitle}</div>
        </div>
        <div className={cx("text-[10px] text-right", ui.textSubtle)}>
          Min, Median, Mean and Max are computed across {fmtInt(temporal.nRuns)} runs for the
          selected period.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6e6682]">
          Period
        </span>
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
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-[#19102b]">
            <tr>
              <th className={TH_METRIC}>Metric</th>
              <th className={cx(TH_NUM, "bg-sky-950/50 text-sky-200/90")}>Original</th>
              <th className={TH_PCT}>Percentile</th>
              <th className={TH_NUM}>Min</th>
              <th className={TH_NUM}>Median</th>
              <th className={TH_NUM}>Mean</th>
              <th className={TH_NUM}>Max</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionBlock key={`${periodId}-${section.key}`} section={section} />
            ))}
          </tbody>
        </table>
      </div>

      <div className={cx("text-[10px]", BT_MUTED)}>
        Values shown as Percentage | Absolute where both axes apply.
      </div>
    </div>
  );
});
