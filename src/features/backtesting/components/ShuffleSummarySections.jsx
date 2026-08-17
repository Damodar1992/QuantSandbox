import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_MUTED, fmtInt, fmtMoney, fmtNum, fmtPct } from "../utils/format";
import { PercentileCell } from "./SyntheticCoreResultsPanel";

const CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] overflow-hidden");
const STATS_BOX = "rounded-md border border-[rgba(60,40,80,0.28)] bg-[#161022] px-2 py-1.5";
const PAIRED_SECTION_KEYS = new Set(["general", "recoveryPeriods"]);

function formatValue(value, format) {
  if (value == null || value === "") return "—";
  if (format === "text") return String(value);
  if (format === "money") return fmtMoney(value, 2, false);
  if (format === "pct") return fmtPct(value, 2, false);
  if (format === "int") return fmtInt(value);
  if (typeof value === "number") return fmtNum(value, 2);
  return String(value);
}

function formatStatValue(value, format) {
  if (value == null || value === "") return "N/A";
  return formatValue(value, format);
}

function chunkPairs(rows) {
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push(rows.slice(i, i + 2));
  }
  return pairs;
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

function SummaryMetricBlock({ row, nRuns, paired = false }) {
  const hasOriginal = row.original != null && row.original !== "";

  return (
    <div
      className={cx(
        "px-3 py-2.5",
        paired ? "min-w-0" : "border-b border-[rgba(60,40,80,0.18)] last:border-b-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-[11px] font-medium text-[#faf7fd]">{row.label}</div>
        <div className="shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums leading-tight text-sky-100">
          {hasOriginal ? formatValue(row.original, row.format) : <span className={BT_MUTED}>N/A</span>}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={cx("text-[9px] font-medium uppercase tracking-wide", ui.textSubtle)}>
          Original vs {fmtInt(nRuns)} runs
        </span>
        {row.originalPct != null ? (
          <div className="min-w-[120px] shrink-0">
            <PercentileCell value={row.originalPct} />
          </div>
        ) : (
          <span className={cx("text-[10px]", BT_MUTED)}>N/A</span>
        )}
      </div>

      <div
        className={cx(
          STATS_BOX,
          "mt-2 flex divide-x divide-[rgba(60,40,80,0.45)] text-center",
        )}
      >
        {[
          { label: "Min", field: "min" },
          { label: "Median", field: "median" },
          { label: "Mean", field: "mean" },
          { label: "Max", field: "max" },
        ].map(({ label, field }) => (
          <div key={field} className="min-w-0 flex-1 px-2 first:pl-0 last:pr-0">
            <div className={cx("text-[9px] font-medium uppercase tracking-wide", ui.textSubtle)}>
              {label}
            </div>
            <div className="mt-0.5 font-mono text-[11px] tabular-nums text-[#d9d9d9]">
              {formatStatValue(row[field], row.format)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummarySectionCard({ section, open, onToggle, nRuns, className }) {
  const allKeys = useMemo(() => section.rows.map((r) => r.key), [section.rows]);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  const visibleRows = useMemo(
    () => section.rows.filter((r) => enabledKeys.has(r.key)),
    [section.rows, enabledKeys],
  );

  const isPaired = PAIRED_SECTION_KEYS.has(section.key);
  const rowGroups = useMemo(
    () => (isPaired ? chunkPairs(visibleRows) : visibleRows.map((row) => [row])),
    [visibleRows, isPaired],
  );

  return (
    <div className={cx(CARD, className)}>
      <div className="flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.3)] bg-[#161022] px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-w-0 flex-1 items-center gap-2 text-left hover:bg-white/[0.03]"
        >
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200">
            {section.title}
          </span>
        </button>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={cx("text-[9px] uppercase tracking-wide", ui.textSubtle)}>
            {enabledKeys.size}/{section.rows.length}
          </span>
          <MetricsVisibilityControl
            rows={section.rows}
            enabledKeys={enabledKeys}
            onChange={setEnabledKeys}
          />
        </div>
      </div>

      {open ? (
        rowGroups.length ? (
          rowGroups.map((rowGroup) => (
            <div
              key={rowGroup.map((row) => row.key).join("-")}
              className={cx(
                isPaired &&
                  "grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.18)] border-b border-[rgba(60,40,80,0.18)] last:border-b-0 xl:grid-cols-2 xl:divide-x xl:divide-y-0",
              )}
            >
              {rowGroup.map((row) => (
                <SummaryMetricBlock
                  key={row.key}
                  row={row}
                  nRuns={nRuns}
                  paired={isPaired && rowGroup.length > 1}
                />
              ))}
            </div>
          ))
        ) : (
          <div className={cx("px-3 py-4 text-center text-[11px]", ui.textSubtle)}>No metrics selected</div>
        )
      ) : null}
    </div>
  );
}

/** Shared GENERAL / MACRO / MICRO stack. */
export const ShuffleSummarySections = memo(function ShuffleSummarySections({
  sections,
  defaultExpanded = true,
  nRuns = 0,
}) {
  const sectionKeys = useMemo(
    () => (sections || []).map((s) => s.key),
    [sections],
  );
  const sectionKeySig = sectionKeys.join("\0");

  const [openSections, setOpenSections] = useState(
    () => new Set(defaultExpanded ? sectionKeys : []),
  );

  useEffect(() => {
    if (!defaultExpanded) return;
    setOpenSections(new Set(sectionKeys));
  }, [defaultExpanded, sectionKeySig, sectionKeys]);

  const toggle = (key) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const layoutItems = useMemo(() => {
    const items = [];
    const list = sections || [];
    for (let i = 0; i < list.length; i += 1) {
      const section = list[i];
      if (section.key === "macro" && list[i + 1]?.key === "micro") {
        items.push({ type: "macroMicroRow", sections: [section, list[i + 1]] });
        i += 1;
      } else {
        items.push({ type: "single", section });
      }
    }
    return items;
  }, [sections]);

  return (
    <div className="space-y-3">
      {layoutItems.map((item) =>
        item.type === "macroMicroRow" ? (
          <div
            key="macro-micro-row"
            className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:items-start"
          >
            {item.sections.map((section) => (
              <SummarySectionCard
                key={section.key}
                section={section}
                open={openSections.has(section.key)}
                onToggle={() => toggle(section.key)}
                nRuns={nRuns}
                className="min-w-0"
              />
            ))}
          </div>
        ) : (
          <SummarySectionCard
            key={item.section.key}
            section={item.section}
            open={openSections.has(item.section.key)}
            onToggle={() => toggle(item.section.key)}
            nRuns={nRuns}
          />
        ),
      )}
    </div>
  );
});
