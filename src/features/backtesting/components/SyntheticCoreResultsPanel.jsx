import React, { memo, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/constants/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BT_CORE_METRICS, BT_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_DRAWDOWN,
  BT_MUTED,
  BT_NEGATIVE,
  BT_POSITIVE,
  fmtCoreMetric,
  fmtInt,
  percentileTone,
} from "../utils/format";
import { BtHeaderWithHelp, BtValueTooltip } from "./BtInfoTooltip";

const TH =
  "px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0";
const TH_METRIC = cx(TH, "text-left min-w-[140px]");
const TH_NUM = cx(TH, "text-right");
const TH_PCT = cx(TH, "text-right min-w-[72px]");
const TD_NUM = cx(TD, "text-right");
const STRIP =
  "flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.3)] px-3 py-2 text-left text-[11px] font-medium hover:bg-white/[0.03] transition-colors bg-violet-500/10 text-violet-200";
const PILL = "rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-100";

function barColors(tone) {
  if (tone === BT_POSITIVE) return { fill: "bg-emerald-400", dot: "bg-emerald-400" };
  if (tone === BT_DRAWDOWN) return { fill: "bg-amber-400", dot: "bg-amber-400" };
  if (tone === BT_NEGATIVE) return { fill: "bg-red-400", dot: "bg-red-400" };
  return { fill: "bg-violet-400", dot: "bg-violet-400" };
}

export function PercentileCell({ value, withBar = true }) {
  if (value == null || value === "" || value === "N/A") {
    return <span className={BT_MUTED}>{value === "N/A" ? "N/A" : "—"}</span>;
  }
  const pct = Math.max(0, Math.min(100, Number(value)));
  const tone = percentileTone(pct);
  const label = `${fmtInt(Math.round(pct))}%`;
  if (!withBar) {
    return <span className={cx("tabular-nums", tone)}>{label}</span>;
  }
  const colors = barColors(tone);
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <span className={cx("w-10 shrink-0 text-right tabular-nums", tone)}>
        {label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#2a2040]">
        <div
          className={cx("absolute inset-y-0 left-0 rounded-full opacity-40", colors.fill)}
          style={{ width: `${pct}%` }}
        />
        <div
          className={cx(
            "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#120b20]",
            colors.dot,
          )}
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
    </div>
  );
}

/** Expanded Synthetic row — Results — Core (Original / Percentile / Min / Median / Mean / Max). */
export const SyntheticCoreResultsPanel = memo(function SyntheticCoreResultsPanel({ run }) {
  const rows = useMemo(() => {
    const byKey = new Map((run?.result?.core || []).map((r) => [r.metric, r]));
    return BT_CORE_METRICS.map((metric) => {
      const hit = byKey.get(metric.key) || {};
      return {
        key: metric.key,
        label: metric.label,
        description: metric.description,
        formula: metric.formula,
        star: hit.star || (metric.kind === "drawdown" ? "max" : "none"),
        original: hit.real ?? hit.original ?? null,
        percentile: hit.percentile ?? null,
        min: hit.min ?? null,
        median: hit.median ?? null,
        mean: hit.mean ?? null,
        max: hit.max ?? null,
      };
    });
  }, [run]);

  const [open, setOpen] = useState(true);

  return (
    <div className="px-1 py-2">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="overflow-hidden rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#110b1d] shadow-[0_10px_24px_rgba(6,3,20,0.24)]"
      >
        <CollapsibleTrigger type="button" className={STRIP}>
          <span className="inline-flex min-w-0 items-center gap-2">
            <ChevronDown
              className={cx(
                "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
            Core metrics
          </span>
          <span className={PILL}>{fmtInt(rows.length)} metrics</span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className={TH_METRIC}>Metric</th>
                  <th className={cx(TH_NUM, "bg-sky-950/50 text-sky-200/90")}>Original</th>
                  <th className={TH_PCT}>
                    <BtHeaderWithHelp label="Percentile" text={BT_TOOLTIPS.percentile}>
                      Percentile
                    </BtHeaderWithHelp>
                  </th>
                  <th className={TH_NUM}>Min</th>
                  <th className={TH_NUM}>Median</th>
                  <th className={TH_NUM}>Mean</th>
                  <th className={TH_NUM}>Max</th>
                </tr>
              </thead>
              <tbody className="text-[#d9d9d9]">
                {rows.map((row) => (
                  <tr key={row.key} className={ROW}>
                    <td className="px-2.5 py-1.5 text-left align-middle text-[11px] text-[#faf7fd]">
                      <span className="inline-flex items-center gap-1">
                        <BtValueTooltip text={row.description} formula={row.formula}>
                          <span>{row.label}</span>
                        </BtValueTooltip>
                        {row.star === "max" ? (
                          <span className="text-amber-300" title="Star on Max">
                            *
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td
                      className={cx(
                        TD_NUM,
                        "bg-sky-950/35 text-[#d9d9d9]",
                      )}
                    >
                      {fmtCoreMetric(row.key, row.original)}
                    </td>
                    <td className={cx(TD_NUM, "align-middle")}>
                      <PercentileCell value={row.percentile} withBar={false} />
                    </td>
                    <td className={cx(TD_NUM, "text-[#b8aecc]")}>
                      {fmtCoreMetric(row.key, row.min)}
                    </td>
                    <td className={cx(TD_NUM, "text-[#b8aecc]")}>
                      {fmtCoreMetric(row.key, row.median)}
                    </td>
                    <td className={cx(TD_NUM, "text-[#b8aecc]")}>
                      {fmtCoreMetric(row.key, row.mean)}
                    </td>
                    <td className={cx(TD_NUM, "text-[#b8aecc]")}>
                      {fmtCoreMetric(row.key, row.max)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
