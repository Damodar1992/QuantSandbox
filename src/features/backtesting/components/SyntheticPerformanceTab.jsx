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
} from "../utils/format";
import { buildSyntheticPerformanceSummary } from "../utils/syntheticPerformanceSummary";
import { BtValueTooltip } from "./BtInfoTooltip";
import { PercentileCell } from "./SyntheticCoreResultsPanel";

const CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] overflow-hidden");
const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";
const STATS_BOX = "rounded-md border border-[rgba(60,40,80,0.28)] bg-[#161022] px-2 py-1.5";

/** Reference card layout — row keys from buildSyntheticPerformanceSummary. */
const PERFORMANCE_LAYOUT = [
  {
    key: "money",
    title: "MONEY — WHERE THE ACCOUNT ENDED UP",
    rows: [
      [
        {
          key: "result",
          title: "RESULT",
          rowKeys: ["netPlPct", "netPlUsdt", "annualPl", "netPlTotal"],
        },
        {
          key: "balances",
          title: "BALANCES AT THE END OF THE RUN",
          rowKeys: ["tradable", "reserved", "totalBal", "ratio"],
        },
      ],
      [
        {
          key: "drawdown",
          title: "DRAWDOWN",
          rowKeys: ["maxDdAccount", "avgDd", "maxDdRealPct", "maxDdRealUsdt", "maxDdAbs"],
        },
        {
          key: "balanceRange",
          title: "BALANCE RANGE AND MARKET",
          rowKeys: ["minBalance", "maxBalance", "marketChange"],
        },
      ],
    ],
  },
  {
    key: "risk-group",
    title: "RISK AND STABILITY",
    rows: [
      [
        {
          key: "riskRatios",
          title: "RISK-ADJUSTED RATIOS",
          rowKeys: ["cagr", "sortino", "sharpe", "calmar", "expectancy", "profitFactor"],
        },
        {
          key: "drawdownWindow",
          title: "DRAWDOWN WINDOW",
          rowKeys: ["ddHighLow", "ddStart", "ddEnd"],
        },
      ],
      [
        {
          key: "consecutiveStreaks",
          title: "CONSECUTIVE STREAKS",
          fullWidth: true,
          rowPairs: [
            ["maxLossN", "maxWinN"],
            ["avgLossN", "avgWinN"],
            ["maxLossAmt", "maxWinAmt"],
            ["avgLossAmt", "avgWinAmt"],
          ],
        },
      ],
    ],
  },
  {
    key: "sample-group",
    title: "SAMPLE AND BEHAVIOUR",
    rows: [
      [
        {
          key: "trades",
          title: "TRADES",
          rowKeys: ["days", "trades", "avgDaily", "winrate", "ccl"],
          hiddenByDefault: ["days"],
        },
        {
          key: "bestWorst",
          title: "BEST AND WORST",
          rowKeys: ["bestDay", "worstDay", "bestTrade", "worstTrade"],
        },
      ],
      [
        {
          key: "outcomeSplit",
          title: "OUTCOME SPLIT",
          fullWidth: true,
          rowPairs: [
            ["outcomeCounts", "outcomeDays"],
            ["avgDurWinners", "avgDurLosers"],
          ],
        },
      ],
    ],
  },
  {
    key: "mechanics-group",
    title: "MECHANICS AND COSTS — SECONDARY",
    rows: [
      [
        {
          key: "costs",
          title: "COSTS",
          fullWidth: true,
          defaultOpen: false,
          rowPairs: [
            ["maker", "taker"],
            ["funding", "totalFees"],
          ],
        },
      ],
      [
        {
          key: "tradeSize",
          title: "TRADE SIZE",
          rowKeys: ["sizeAvg", "sizeMin", "sizeMax"],
        },
        {
          key: "tradeDuration",
          title: "TRADE DURATION",
          rowKeys: ["durAvg", "durMin", "durMax"],
        },
      ],
      [
        {
          key: "downtime",
          title: "DOWNTIME BETWEEN TRADES",
          rowKeys: ["downAvg", "downMin", "downMax"],
        },
        {
          key: "directionSplit",
          title: "DIRECTION SPLIT",
          rowKeys: ["longShortCounts", "netPlLong", "netPlShort"],
        },
      ],
    ],
  },
];

function indexRows(sections) {
  const map = new Map();
  for (const section of sections || []) {
    for (const row of section.rows || []) {
      if (!map.has(row.key)) map.set(row.key, row);
    }
  }
  return map;
}

function MetricLabel({ label, tipKey }) {
  const tip = BT_PERFORMANCE_TOOLTIPS[tipKey];
  const tipObj = typeof tip === "string" ? { text: tip } : tip;
  if (!tipObj?.text && !tipObj?.formula) return label;
  return (
    <BtValueTooltip text={tipObj.text} formula={tipObj.formula}>
      <span className={LABEL_DOTTED}>{label}</span>
    </BtValueTooltip>
  );
}

function toneClass(tone, value) {
  if (tone === "drawdown-text" || tone === "drawdown-pct" || tone === "drawdown-money") {
    return BT_DRAWDOWN;
  }
  if (tone === "neg-text" || tone === "int-neg" || tone === "num-neg") return BT_NEGATIVE;
  if (tone === "pos-text" || tone === "int-pos" || tone === "num-pos") return BT_POSITIVE;
  if (tone === "signed" || tone === "money") {
    const num = Number(value);
    if (!Number.isFinite(num)) return BT_MUTED;
    return num > 0 ? BT_POSITIVE : num < 0 ? BT_NEGATIVE : BT_NEUTRAL;
  }
  if (tone === "pf") {
    const num = Number(value);
    if (!Number.isFinite(num)) return BT_MUTED;
    return num >= 1 ? BT_POSITIVE : BT_NEGATIVE;
  }
  return BT_NEUTRAL;
}

function formatField(row, field) {
  const value = row[field];
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  if (row.tone === "drawdown-pct") return fmtPct(value, 2, false);
  if (row.tone === "int" || row.tone === "int-neg" || row.tone === "int-pos") return fmtInt(value);
  if (row.tone === "num" || row.tone === "num-neg" || row.tone === "num-pos") return fmtNum(value, 2);
  if (row.tone === "signed") return fmtPct(value, 2, true);
  if (row.tone === "pf") return fmtNum(value, 2);
  if (row.tone === "money" || row.tone === "drawdown-money") {
    const money = fmtMoney(value, 2, row.tone === "money");
    return money === "—" ? money : `${money}${row.unit ? ` ${row.unit}` : ""}`;
  }
  if (row.tone === "money-unsigned") {
    const money = fmtMoney(value, 2, false);
    return money === "—" ? money : `${money}${row.unit ? ` ${row.unit}` : ""}`;
  }
  return String(value);
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
        className="w-[300px] border-[rgba(60,40,80,0.45)] bg-[#170f29] p-1.5 shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
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

function MetricBlock({ row, nRuns, paired = false }) {
  const originalDisplay =
    typeof row.original === "string" ? row.original : formatField(row, "original");
  const valueTone = toneClass(row.tone, row.original);

  return (
    <div
      className={cx(
        "px-3 py-2.5",
        paired ? "min-w-0" : "border-b border-[rgba(60,40,80,0.18)] last:border-b-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-[11px] font-medium text-[#faf7fd]">
          <MetricLabel label={row.label} tipKey={row.key} />
        </div>
        <div className="shrink-0 text-right">
          <div
            className={cx(
              "inline-flex flex-wrap items-baseline justify-end gap-x-1.5 font-mono text-[13px] font-semibold tabular-nums leading-tight",
              valueTone,
            )}
          >
            <span>{originalDisplay}</span>
            {row.sub ? (
              <>
                <span className="font-normal opacity-70">·</span>
                <span>{row.sub}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {!row.textOnly && row.percentile != null ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={cx("text-[9px] font-medium uppercase tracking-wide", ui.textSubtle)}>
            Original vs {fmtInt(nRuns)} runs
          </span>
          <div className="min-w-[120px] shrink-0">
            <PercentileCell value={row.percentile} />
          </div>
        </div>
      ) : null}

      {!row.textOnly ? (
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
                {formatField(row, field)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PerformanceCard({ card, rowsByKey, nRuns }) {
  const flatKeys = useMemo(
    () => (card.rowPairs ? card.rowPairs.flat() : card.rowKeys || []),
    [card.rowPairs, card.rowKeys],
  );
  const rows = useMemo(
    () => flatKeys.map((key) => rowsByKey.get(key)).filter(Boolean),
    [flatKeys, rowsByKey],
  );
  const allKeys = useMemo(() => rows.map((r) => r.key), [rows]);
  const defaultEnabledKeys = useMemo(() => {
    const hidden = new Set(card.hiddenByDefault || []);
    return allKeys.filter((key) => !hidden.has(key));
  }, [allKeys, card.hiddenByDefault]);
  const [open, setOpen] = useState(card.defaultOpen !== false);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(defaultEnabledKeys));

  useEffect(() => {
    setEnabledKeys(new Set(defaultEnabledKeys));
  }, [defaultEnabledKeys]);

  const visibleRows = rows.filter((r) => enabledKeys.has(r.key));
  const visibleMetricRows = useMemo(() => {
    if (!card.rowPairs?.length) return null;
    return card.rowPairs
      .map((keys) =>
        keys
          .map((key) => rowsByKey.get(key))
          .filter((row) => row && enabledKeys.has(row.key)),
      )
      .filter((rowGroup) => rowGroup.length);
  }, [card.rowPairs, rowsByKey, enabledKeys]);

  const metricRowGridClass = (count) => {
    if (count <= 1) return "";
    if (count === 2) {
      return "grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.18)] xl:grid-cols-2 xl:divide-x xl:divide-y-0";
    }
    if (count === 3) {
      return "grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.18)] sm:grid-cols-3 sm:divide-x sm:divide-y-0";
    }
    return "grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.18)] sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-y-0";
  };

  if (!rows.length) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={CARD}>
      <CollapsibleTrigger type="button" className="flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.3)] bg-[#161022] px-3 py-2 text-left hover:bg-white/[0.03]">
        <span className="inline-flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200">
            {card.title}
          </span>
        </span>
        <div className="inline-flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className={cx("text-[9px] uppercase tracking-wide", ui.textSubtle)}>
            {enabledKeys.size}/{rows.length}
          </span>
          <MetricsVisibilityControl rows={rows} enabledKeys={enabledKeys} onChange={setEnabledKeys} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {visibleMetricRows?.length ? (
          visibleMetricRows.map((rowGroup) => (
            <div
              key={rowGroup.map((row) => row.key).join("-")}
              className={cx(
                "border-b border-[rgba(60,40,80,0.18)] last:border-b-0",
                metricRowGridClass(rowGroup.length),
              )}
            >
              {rowGroup.map((row) => (
                <MetricBlock
                  key={row.key}
                  row={row}
                  nRuns={nRuns}
                  paired={rowGroup.length > 1}
                />
              ))}
            </div>
          ))
        ) : visibleRows.length ? (
          visibleRows.map((row) => <MetricBlock key={row.key} row={row} nRuns={nRuns} />)
        ) : (
          <div className={cx("px-3 py-4 text-center text-[11px]", ui.textSubtle)}>No metrics selected</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function LayoutGroup({ group, rowsByKey, nRuns }) {
  return (
    <div className="space-y-2">
      {group.title ? (
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6e6682]">
          {group.title}
        </div>
      ) : null}
      <div className="space-y-3">
        {group.rows.map((cards) => (
          <div
            key={cards.map((card) => card.key).join("-")}
            className="grid grid-cols-1 gap-3 xl:grid-cols-2"
          >
            {cards.map((card) => (
              <div key={card.key} className={card.fullWidth ? "xl:col-span-2" : undefined}>
                <PerformanceCard card={card} rowsByKey={rowsByKey} nRuns={nRuns} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Synthetic info → Performance (card layout with distribution stats). */
export const SyntheticPerformanceTab = memo(function SyntheticPerformanceTab({
  run,
  parentRun,
}) {
  const performance = useMemo(
    () => buildSyntheticPerformanceSummary(run, parentRun),
    [run, parentRun],
  );

  const rowsByKey = useMemo(
    () => indexRows(performance?.sections),
    [performance?.sections],
  );

  const nRuns = performance?.nRuns ?? Number(run?.config?.nRuns) ?? 1000;

  if (!performance?.sections?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No performance summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {PERFORMANCE_LAYOUT.map((group) => (
        <LayoutGroup key={group.key} group={group} rowsByKey={rowsByKey} nRuns={nRuns} />
      ))}
    </div>
  );
});
