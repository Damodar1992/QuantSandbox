import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_FEES_TOOLTIPS } from "@/constants/backtesting";
import { BT_MUTED, BT_NEUTRAL, fmtInt } from "../utils/format";
import { fmtMoneyUsdt } from "../utils/feesSettingsSummary";
import { buildSyntheticFeesSummary } from "../utils/syntheticFeesSummary";
import { BtValueTooltip } from "./BtInfoTooltip";
import {
  DISTRIBUTION_HEADER_CLASS,
  DISTRIBUTION_META_CLASS,
  DISTRIBUTION_TITLE_CLASS,
  DistributionMetricRow,
  distributionHeaderMeta,
  formatRailValue,
} from "./DistributionMetricRow";

const CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] overflow-hidden");
const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

const FEES_LAYOUT = [
  {
    key: "fees",
    title: "FEES FOR OPEN AND CLOSED ORDERS",
    fullWidth: true,
    rowPairs: [
      ["openTaker", "closeTaker"],
      ["openMaker", "closeMaker"],
      ["totalOpen", "totalClose"],
    ],
  },
];

function indexRows(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (!map.has(row.key)) map.set(row.key, row);
  }
  return map;
}

function MetricLabel({ label, tipKey }) {
  const tip = tipKey ? BT_FEES_TOOLTIPS[tipKey] : null;
  const tipObj = typeof tip === "string" ? { text: tip } : tip;
  if (!tipObj?.text && !tipObj?.formula) return label;
  return (
    <BtValueTooltip text={tipObj.text} formula={tipObj.formula}>
      <span className={LABEL_DOTTED}>{label}</span>
    </BtValueTooltip>
  );
}

function formatFee(value) {
  if (value == null) return null;
  return fmtMoneyUsdt(value);
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
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {rows.map((row) => (
            <label
              key={row.key}
              className={cx(
                "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]",
                enabledKeys.has(row.key) && "bg-violet-500/10 text-violet-200",
              )}
            >
              <Checkbox
                checked={enabledKeys.has(row.key)}
                onCheckedChange={() => toggle(row.key)}
                className="size-3.5 border-[#505050]"
              />
              <span className="truncate">{row.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FeeMetricBlock({ row }) {
  const hasOriginal = row.original != null;
  const hideRail = Boolean(row.statsUnavailable) || row.min == null;

  return (
    <DistributionMetricRow
      label={<MetricLabel label={row.label} tipKey={row.tipKey} />}
      value={hasOriginal ? formatFee(row.original) : "N/A"}
      valueClassName={hasOriginal ? BT_NEUTRAL : BT_MUTED}
      percentile={row.percentile}
      original={row.original}
      min={row.min}
      median={row.median}
      mean={row.mean}
      max={row.max}
      formatRail={(value) => (value == null ? "N/A" : formatRailValue(value, "money", { signed: true }))}
      hideRail={hideRail}
    />
  );
}

function FeesCard({ card, rowsByKey, nRuns, subtitle }) {
  const flatKeys = useMemo(() => card.rowPairs.flat(), [card.rowPairs]);
  const rows = useMemo(
    () => flatKeys.map((key) => rowsByKey.get(key)).filter(Boolean),
    [flatKeys, rowsByKey],
  );
  const allKeys = useMemo(() => rows.map((r) => r.key), [rows]);
  const [open, setOpen] = useState(card.defaultOpen !== false);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  const visibleMetricRows = useMemo(
    () =>
      card.rowPairs
        .map((keys) =>
          keys
            .map((key) => rowsByKey.get(key))
            .filter((row) => row && enabledKeys.has(row.key)),
        )
        .filter((rowGroup) => rowGroup.length),
    [card.rowPairs, rowsByKey, enabledKeys],
  );

  if (!rows.length) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={CARD}>
      <CollapsibleTrigger type="button" className={DISTRIBUTION_HEADER_CLASS}>
        <span className="inline-flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className={DISTRIBUTION_TITLE_CLASS}>
              {card.title}
            </span>
            {subtitle ? (
              <span className={cx("mt-0.5 block text-[10px] font-normal normal-case", ui.textSubtle)}>
                {subtitle}
              </span>
            ) : null}
          </span>
        </span>
        <div className="inline-flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={DISTRIBUTION_META_CLASS}>
            {distributionHeaderMeta(nRuns, enabledKeys.size, rows.length)}
          </span>
          <MetricsVisibilityControl rows={rows} enabledKeys={enabledKeys} onChange={setEnabledKeys} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {visibleMetricRows.length ? (
          visibleMetricRows.map((rowGroup) => (
            <div
              key={rowGroup.map((row) => row.key).join("-")}
              className={cx(
                "border-b border-[rgba(60,40,80,0.16)] last:border-b-0",
                rowGroup.length > 1 &&
                  "grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.16)] xl:grid-cols-2 xl:divide-x xl:divide-y-0",
              )}
            >
              {rowGroup.map((row) => (
                <FeeMetricBlock key={row.key} row={row} />
              ))}
            </div>
          ))
        ) : (
          <div className={cx("px-3 py-4 text-center text-[11px]", ui.textSubtle)}>No metrics selected</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Synthetic info → Fees (card layout with distribution stats). */
export const SyntheticFeesTab = memo(function SyntheticFeesTab({ run, parentRun }) {
  const fees = useMemo(() => buildSyntheticFeesSummary(run, parentRun), [run, parentRun]);

  const rowsByKey = useMemo(() => indexRows(fees?.rows), [fees?.rows]);
  const nRuns = Number(run?.config?.nRuns) || Number(run?.result?.nValid) || 1000;

  if (!fees?.rows?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No fees summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
            Fees summary
          </div>
          <div className={cx("mt-0.5 text-[10px]", ui.textSubtle)}>
            Entry and exit costs split by order type.
          </div>
        </div>
        <div className={cx("text-[10px] text-right", ui.textSubtle)}>
          Min, Median, Mean and Max are computed across {fmtInt(nRuns)} runs.
        </div>
      </div>

      {FEES_LAYOUT.map((card) => (
        <div key={card.key} className={card.fullWidth ? "xl:col-span-2" : undefined}>
          <FeesCard card={card} rowsByKey={rowsByKey} nRuns={nRuns} subtitle={fees.subtitle} />
        </div>
      ))}
    </div>
  );
});
