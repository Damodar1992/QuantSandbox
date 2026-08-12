import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_MUTED, fmtInt, fmtMoney, fmtNum, fmtPct } from "../utils/format";

const TH =
  "px-2.5 py-1.5 text-left text-[9px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-2.5 py-1.5 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0";

function formatValue(value, format) {
  if (value == null || value === "") return "—";
  if (format === "text") return String(value);
  if (format === "money") return fmtMoney(value, 2, false);
  if (format === "pct") return fmtPct(value, 2, false);
  if (format === "int") return fmtInt(value);
  if (typeof value === "number") return fmtNum(value, 2);
  return String(value);
}

function formatPct(value) {
  if (value == null) return "N/A";
  return `${fmtInt(value)}%`;
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
          <Settings2 className="h-3.5 w-3.5" />
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

export function SummarySectionCard({ section, open, onToggle }) {
  const allKeys = useMemo(() => section.rows.map((r) => r.key), [section.rows]);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  const visibleRows = section.rows.filter((r) => enabledKeys.has(r.key));

  return (
    <div className={cx(ui.radius, "overflow-hidden border border-[rgba(60,40,80,0.35)] bg-[#120b20]")}>
      <div className="flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.3)] bg-[#161022] px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">
            {section.title}
          </span>
        </button>

        <MetricsVisibilityControl
          rows={section.rows}
          enabledKeys={enabledKeys}
          onChange={setEnabledKeys}
        />
      </div>

      {open ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>Metric</th>
                <th className={cx(TH, "bg-sky-950/50 text-sky-200/90")}>Original</th>
                <th className={cx(TH, "bg-emerald-950/40 text-sky-200/90")}>
                  <span className="text-emerald-300">Percentile</span>
                </th>
                <th className={TH}>Mean</th>
                <th className={TH}>Median</th>
                <th className={TH}>Max</th>
                <th className={TH}>Min</th>
              </tr>
            </thead>
            <tbody className="text-[#d9d9d9]">
              {visibleRows.map((r) => (
                <tr key={r.key} className={ROW}>
                  <td className="px-2.5 py-1.5 text-left text-[11px] text-[#faf7fd]">{r.label}</td>
                  <td className={cx(TD, "bg-sky-950/35 text-right text-sky-100")}>
                    {formatValue(r.original, r.format)}
                  </td>
                  <td
                    className={cx(
                      TD,
                      "bg-emerald-950/30 text-right",
                      r.originalPct == null ? BT_MUTED : "text-emerald-400",
                    )}
                  >
                    {formatPct(r.originalPct)}
                  </td>
                  <td className={cx(TD, "text-right")}>{formatValue(r.mean, r.format)}</td>
                  <td className={cx(TD, "text-right")}>{formatValue(r.median, r.format)}</td>
                  <td className={cx(TD, "text-right")}>{formatValue(r.max, r.format)}</td>
                  <td className={cx(TD, "text-right")}>{formatValue(r.min, r.format)}</td>
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
      ) : null}
    </div>
  );
}

/** Shared GENERAL / MACRO / MICRO stack. */
export const ShuffleSummarySections = memo(function ShuffleSummarySections({
  sections,
}) {
  const [openSections, setOpenSections] = useState(
    () => new Set((sections || []).map((s) => s.key)),
  );

  const toggle = (key) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {(sections || []).map((section) => (
        <SummarySectionCard
          key={section.key}
          section={section}
          open={openSections.has(section.key)}
          onToggle={() => toggle(section.key)}
        />
      ))}
    </div>
  );
});
