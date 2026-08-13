import { memo, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_FEES_TOOLTIPS } from "@/constants/backtesting";
import { BT_MUTED, BT_NEGATIVE, BT_NEUTRAL } from "../utils/format";
import { buildFeesSummary, fmtMoneyUsdt } from "../utils/feesSettingsSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";

const CARD_SHELL = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 space-y-2");

const FEE_FIELDS = [
  { key: "openTaker", label: "Open taker fee", naNull: true },
  { key: "openMaker", label: "Open maker fee", naNull: true },
  { key: "totalOpen", label: "Total open fee", naNull: false },
  { key: "closeTaker", label: "Close taker fee", naNull: true },
  { key: "closeMaker", label: "Close maker fee", naNull: true },
  { key: "totalClose", label: "Total close fee", naNull: false },
];

function formatFee(value, { naNull = true } = {}) {
  if (naNull && (value == null || value === "")) return "N/A";
  return fmtMoneyUsdt(value);
}

function feeTone(value, { naNull = true } = {}) {
  if (naNull && (value == null || value === "")) return BT_MUTED;
  return Number(value) < 0 ? BT_NEGATIVE : BT_NEUTRAL;
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

function FeePairCard({ row }) {
  const options = FEE_FIELDS.map((field) => ({ key: field.key, label: field.label }));
  const allKeys = options.map((o) => o.key);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [row.pair]);

  const visibleFields = FEE_FIELDS.filter((field) => enabledKeys.has(field.key));

  return (
    <div className={CARD_SHELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
            {row.pair}
          </div>
          <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>
            Entry and exit costs split by order type.
          </div>
        </div>
        <MetricsVisibilityControl
          rows={options}
          enabledKeys={enabledKeys}
          onChange={setEnabledKeys}
        />
      </div>
      <ul className="space-y-1.5">
        {visibleFields.map((field) => {
          const value = row[field.key];
          const opts = { naNull: field.naNull };
          return (
            <li
              key={field.key}
              className="flex items-baseline justify-between gap-3 text-[11px]"
            >
              <span className={cx(BT_MUTED, "inline-flex min-w-0 items-center gap-1")}>
                <BtHeaderWithHelp label={field.label} tip={BT_FEES_TOOLTIPS[field.key]}>
                  <span className="truncate">{field.label}</span>
                </BtHeaderWithHelp>
              </span>
              <span className={cx("shrink-0 font-mono tabular-nums text-right", feeTone(value, opts))}>
                {formatFee(value, opts)}
              </span>
            </li>
          );
        })}
        {!visibleFields.length ? (
          <li className={cx("py-1 text-center text-[11px]", ui.textSubtle)}>No metrics selected</li>
        ) : null}
      </ul>
    </div>
  );
}

export const FeesSummaryTab = memo(function FeesSummaryTab({ run }) {
  const fees = useMemo(() => {
    if (run?.result?.fees) return run.result.fees;
    if (!run?.result?.core) return null;
    return buildFeesSummary(run);
  }, [run]);

  const pairRows = useMemo(
    () => (fees?.rows || []).filter((row) => row?.pair && row.pair !== "TOTAL"),
    [fees],
  );

  if (!pairRows.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No fees summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Fees for open and closed orders
        </div>
        {fees.subtitle ? (
          <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>{fees.subtitle}</div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pairRows.map((row) => (
          <FeePairCard key={row.pair} row={row} />
        ))}
      </div>
    </div>
  );
});
