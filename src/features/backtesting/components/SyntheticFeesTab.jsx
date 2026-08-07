import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_FEES_TOOLTIPS } from "@/constants/backtesting";
import { BT_MUTED, fmtInt } from "../utils/format";
import { fmtMoneyUsdt } from "../utils/feesSettingsSummary";
import { buildSyntheticFeesSummary } from "../utils/syntheticFeesSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";
import { PercentileCell } from "./SyntheticCoreResultsPanel";

const TH =
  "px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const TH_METRIC = cx(TH, "text-left min-w-[180px]");
const TH_NUM = cx(TH, "text-right");
const TH_PCT = cx(TH, "text-left min-w-[140px]");
const TD_NUM = cx(TD, "text-right");
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0";

function formatFee(value) {
  if (value == null) return null;
  return fmtMoneyUsdt(value);
}

function FeeValue({ value }) {
  if (value == null) return <span className={BT_MUTED}>N/A</span>;
  return <span className="text-[#d9d9d9]">{formatFee(value)}</span>;
}

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
        className="w-[280px] border-[rgba(60,40,80,0.45)] bg-[#170f29] p-1.5 shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
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

/** Synthetic info → Fees (Original / Percentile / Min / Median / Mean / Max). */
export const SyntheticFeesTab = memo(function SyntheticFeesTab({ run, parentRun }) {
  const fees = useMemo(() => buildSyntheticFeesSummary(run, parentRun), [run, parentRun]);
  const allKeys = useMemo(() => (fees?.rows || []).map((r) => r.key), [fees]);
  const [open, setOpen] = useState(true);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  if (!fees?.rows?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No fees summary for this run.
      </div>
    );
  }

  const visibleRows = fees.rows.filter((r) => enabledKeys.has(r.key));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronDown
          className={cx(
            "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
            open && "rotate-180",
          )}
        />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
            {fees.title}
          </div>
          <div className={cx("text-[10px]", ui.textSubtle)}>
            {fmtInt(fees.rows.length)} metrics
          </div>
        </div>
      </button>

      {open ? (
        <div className={cx(ui.radius, "overflow-hidden border border-[rgba(60,40,80,0.35)] bg-[#120b20]")}>
          <div className="flex items-start justify-between gap-3 border-b border-[rgba(60,40,80,0.3)] bg-[#161022] px-3 py-2">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
                Fees for open and closed orders
              </div>
              {fees.subtitle ? (
                <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>
                  {fees.subtitle}
                </div>
              ) : null}
            </div>
            <div className="inline-flex shrink-0 items-center gap-2">
              <span className={cx("text-[10px] uppercase tracking-wide", ui.textSubtle)}>
                {enabledKeys.size} metrics
              </span>
              <MetricsVisibilityControl
                rows={fees.rows.map((r) => ({ key: r.key, label: r.label }))}
                enabledKeys={enabledKeys}
                onChange={setEnabledKeys}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[11.5%]" />
                <col className="w-[11.5%]" />
                <col className="w-[11.5%]" />
                <col className="w-[11.5%]" />
              </colgroup>
              <thead>
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
              <tbody className="text-[#d9d9d9]">
                {visibleRows.map((row) => (
                  <tr key={row.key} className={ROW}>
                    <td className="px-2.5 py-1.5 text-left text-[11px] font-medium text-[#faf7fd]">
                      {row.tipKey && BT_FEES_TOOLTIPS[row.tipKey] ? (
                        <BtHeaderWithHelp label={row.label} tip={BT_FEES_TOOLTIPS[row.tipKey]}>
                          <span className="border-b border-dotted border-[#8c8c8c]/60">
                            {row.label}
                          </span>
                        </BtHeaderWithHelp>
                      ) : (
                        row.label
                      )}
                    </td>
                    <td className={cx(TD_NUM, "bg-sky-950/35")}>
                      <FeeValue value={row.original} />
                    </td>
                    <td className={TD}>
                      {row.na || row.percentile == null ? (
                        <span className={BT_MUTED}>n/a</span>
                      ) : (
                        <PercentileCell value={row.percentile} />
                      )}
                    </td>
                    <td className={TD_NUM}>
                      <FeeValue value={row.min} />
                    </td>
                    <td className={TD_NUM}>
                      <FeeValue value={row.median} />
                    </td>
                    <td className={TD_NUM}>
                      <FeeValue value={row.mean} />
                    </td>
                    <td className={TD_NUM}>
                      <FeeValue value={row.max} />
                    </td>
                  </tr>
                ))}
                {!visibleRows.length ? (
                  <tr>
                    <td colSpan={7} className={cx("px-3 py-4 text-center text-[11px]", ui.textSubtle)}>
                      No metrics selected
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
});
