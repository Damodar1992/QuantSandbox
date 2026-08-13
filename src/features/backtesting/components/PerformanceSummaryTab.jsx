import { memo, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BT_PERFORMANCE_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_DRAWDOWN,
  BT_MUTED,
  BT_NEGATIVE,
  BT_NEUTRAL,
  BT_POSITIVE,
  fmtInt,
  fmtMoney,
  fmtNum,
  fmtPct,
  isMissing,
} from "../utils/format";
import { buildPerformanceSummary } from "../utils/mockResults";
import { BtHeaderWithHelp } from "./BtInfoTooltip";

const CARD_SHELL = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 space-y-2");

function toneClass(tone, value) {
  switch (tone) {
    case "signed":
    case "money":
      if (isMissing(value)) return BT_MUTED;
      return Number(value) > 0 ? BT_POSITIVE : Number(value) < 0 ? BT_NEGATIVE : BT_NEUTRAL;
    case "drawdown-text":
    case "drawdown-money":
    case "drawdown-pct":
      return BT_DRAWDOWN;
    case "int-neg":
    case "num-neg":
    case "neg-text":
      return BT_NEGATIVE;
    case "int-pos":
    case "num-pos":
    case "pos-text":
      return BT_POSITIVE;
    case "pf":
      if (isMissing(value)) return BT_MUTED;
      return Number(value) >= 1 ? BT_POSITIVE : BT_NEGATIVE;
    case "neutral-text":
    case "int":
    case "num":
    case "money-unsigned":
    default:
      return BT_NEUTRAL;
  }
}

function formatCell(row, which) {
  const value = row[which];
  if (row.tone === "neutral-text" || row.tone === "drawdown-text" || typeof value === "string") {
    return value ?? "—";
  }
  if (row.tone === "drawdown-pct") {
    return fmtPct(value, 2, false);
  }
  if (row.tone === "int" || row.tone === "int-neg" || row.tone === "int-pos") {
    return fmtInt(value);
  }
  if (row.tone === "num" || row.tone === "num-neg" || row.tone === "num-pos") {
    return fmtNum(value, 2);
  }
  if (row.tone === "signed") {
    return fmtPct(value, 2, true);
  }
  if (row.tone === "money" || row.tone === "drawdown-money") {
    const money = fmtMoney(value, 2, row.tone === "money");
    return money === "—" ? money : `${money}${row.unit ? ` ${row.unit}` : ""}`;
  }
  if (row.tone === "money-unsigned") {
    const money = fmtMoney(value, 2, false);
    return money === "—" ? money : `${money}${row.unit ? ` ${row.unit}` : ""}`;
  }
  return String(value ?? "—");
}

function formatCardValue(row) {
  if (row.text != null) return row.text;
  if (row.tone === "signed") {
    const suffix = row.suffix || "";
    if (suffix === "%") return fmtPct(row.value, 2, true);
    return `${fmtNum(row.value, 2)}${suffix}`;
  }
  if (row.tone === "pf" || row.tone === "num") return fmtNum(row.value, 2);
  return String(row.value ?? "—");
}

function cardValueClass(row) {
  if (row.tone === "signed" || row.tone === "pf") return toneClass(row.tone, row.value);
  return toneClass(row.tone);
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

function useEnabledKeys(rowKeys) {
  const signature = rowKeys.join("|");
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(rowKeys));

  useEffect(() => {
    setEnabledKeys(new Set(signature ? signature.split("|") : []));
  }, [signature]);

  return [enabledKeys, setEnabledKeys];
}

function MetricCard({ title, hint, options, enabledKeys, onChange, children }) {
  return (
    <div className={CARD_SHELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
            {title}
          </div>
          {hint ? (
            <div className={cx("mt-0.5 text-[10px] leading-snug", ui.textSubtle)}>{hint}</div>
          ) : null}
        </div>
        <MetricsVisibilityControl rows={options} enabledKeys={enabledKeys} onChange={onChange} />
      </div>
      {children}
    </div>
  );
}

function MetricRows({ rows, getValue, getValueClass }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((row, i) => (
        <li
          key={row.key || row.label || i}
          className="flex items-baseline justify-between gap-3 text-[11px]"
        >
          <span className={cx(BT_MUTED, "inline-flex min-w-0 items-center gap-1")}>
            <BtHeaderWithHelp
              label={row.label}
              tip={row.key ? BT_PERFORMANCE_TOOLTIPS[row.key] : null}
            >
              <span className="truncate">{row.label}</span>
            </BtHeaderWithHelp>
          </span>
          <span className={cx("shrink-0 font-mono tabular-nums text-right", getValueClass(row))}>
            {getValue(row)}
          </span>
        </li>
      ))}
      {!rows.length ? (
        <li className={cx("py-1 text-center text-[11px]", ui.textSubtle)}>No metrics selected</li>
      ) : null}
    </ul>
  );
}

function SectionBlock({ section }) {
  const options = useMemo(
    () => section.rows.map((r) => ({ key: r.key, label: r.label })),
    [section.rows],
  );
  const allKeys = useMemo(() => options.map((o) => o.key), [options]);
  const [enabledKeys, setEnabledKeys] = useEnabledKeys(allKeys);
  const visibleRows = section.rows.filter((r) => enabledKeys.has(r.key));

  return (
    <MetricCard
      title={section.title}
      hint={section.hint}
      options={options}
      enabledKeys={enabledKeys}
      onChange={setEnabledKeys}
    >
      <MetricRows
        rows={visibleRows}
        getValue={(row) => formatCell(row, "total")}
        getValueClass={(row) => toneClass(row.tone, row.total)}
      />
    </MetricCard>
  );
}

function CardBlock({ card }) {
  const options = useMemo(
    () =>
      card.rows.map((r, i) => ({
        key: r.key || `row-${i}`,
        label: r.label,
      })),
    [card.rows],
  );
  const allKeys = useMemo(() => options.map((o) => o.key), [options]);
  const [enabledKeys, setEnabledKeys] = useEnabledKeys(allKeys);
  const visibleRows = card.rows.filter((r, i) => enabledKeys.has(r.key || `row-${i}`));

  return (
    <MetricCard
      title={card.title}
      options={options}
      enabledKeys={enabledKeys}
      onChange={setEnabledKeys}
    >
      <MetricRows
        rows={visibleRows}
        getValue={formatCardValue}
        getValueClass={cardValueClass}
      />
    </MetricCard>
  );
}

function ensurePerformance(run) {
  const existing = run?.result?.performance;
  const hasCurrentShape = existing?.sections?.some((section) =>
    section.rows?.some((row) => row.key === "maxDdAccount" || row.key === "durAvg"),
  ) && existing?.cards?.some((card) => card.rows?.some((row) => row.key === "avgDurWinners"));
  if (hasCurrentShape) return existing;

  const core = run?.result?.core;
  const streaks = run?.result?.streaks;
  if (!core || !run) return null;

  // Fallback for runs created before performance was added to the mock.
  let h = 2166136261;
  const seed = `backtest|${run.id}`;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  const rnd = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return buildPerformanceSummary(run, {
    rnd,
    roi: core.roi,
    pnl: core.pnl,
    maxdd: core.maxdd,
    pf: core.pf,
    winrate: core.winrate,
    trades: core.trades,
    wins: streaks?.wins ?? Math.max(1, Math.round((core.trades * core.winrate) / 100)),
    losses:
      streaks?.losses ??
      Math.max(1, core.trades - Math.round((core.trades * core.winrate) / 100)),
    startingCapital: Number(run.params?.startingCapital) || 10000,
  });
}

export const PerformanceSummaryTab = memo(function PerformanceSummaryTab({ run }) {
  const performance = useMemo(() => ensurePerformance(run), [run]);

  if (!performance?.sections?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No performance summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
        Performance summary
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {performance.sections.map((section) => (
          <SectionBlock key={section.key} section={section} />
        ))}
      </div>

      {performance.cards?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {performance.cards.map((card) => (
            <CardBlock key={card.key} card={card} />
          ))}
        </div>
      ) : null}
    </div>
  );
});
