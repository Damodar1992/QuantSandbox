import React, { memo, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cx, ui } from "../../../../constants/ui";
import { formatMbMoney, formatMbNum, formatMbPct } from "../../utils/miniBacktestDisplay";

const CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] overflow-hidden");
const COMPARE_BOX = "rounded-md border border-[rgba(60,40,80,0.28)] bg-[#161022] overflow-hidden";

function buildDelta(before, after, { pp = false, invertTone = false, money = false } = {}) {
  if (before == null || after == null || Number.isNaN(before) || Number.isNaN(after)) return null;
  const diff = after - before;
  if (Number.isNaN(diff)) return null;
  const positive = invertTone ? diff <= 0 : diff >= 0;
  let primary;
  if (money) primary = formatMbMoney(diff);
  else if (pp) primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pp`;
  else primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`;
  return { primary, positive };
}

function formatIntrinsicNum(val, decimals = 2) {
  if (val == null || Number.isNaN(val)) return "—";
  if (val === Infinity) return "∞";
  if (val === -Infinity) return "−∞";
  return formatMbNum(val, decimals);
}

function chunkPairs(rows) {
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push(rows.slice(i, i + 2));
  }
  return pairs;
}

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const tone = delta.positive
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
    : "text-red-400 bg-red-500/10 border-red-500/25";
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
        tone,
      )}
    >
      <span>{delta.positive ? "▲" : "▼"}</span>
      <span>{delta.primary}</span>
    </span>
  );
}

function CatBadge({ type }) {
  if (type === "paired") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded border border-violet-500/25 bg-violet-500/10 px-1 py-px text-[8px] font-bold text-violet-300">
        Paired
      </span>
    );
  }
  if (type === "carried") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded border border-teal-500/25 bg-teal-500/10 px-1 py-px text-[8px] font-bold text-teal-300">
        Carried
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded border border-[rgba(60,40,80,0.4)] bg-[#1f1f30] px-1 py-px text-[8px] font-bold text-[#8c8c8c]">
      No-pair
    </span>
  );
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
              <span className="truncate">{row.name}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CompareSide({ label, value, formula, tone = "before", dim = false }) {
  const isBefore = tone === "before";
  return (
    <div className={cx("min-w-0 px-2.5 py-2", isBefore ? "bg-blue-500/[0.04]" : "bg-violet-500/[0.04]")}>
      <div
        className={cx(
          "text-[9px] font-medium uppercase tracking-wide",
          isBefore ? "text-blue-300/70" : "text-violet-300/70",
        )}
      >
        {label}
      </div>
      <div
        className={cx(
          "mt-1 font-mono text-[13px] font-semibold tabular-nums leading-tight",
          dim ? "text-[#4a4a5a]" : "text-[#faf7fd]",
        )}
      >
        {value}
      </div>
      {formula ? (
        <div
          className={cx(
            "mt-1 truncate font-mono text-[9px] leading-snug",
            isBefore ? "text-blue-300/50" : "text-violet-300/50",
          )}
          title={formula}
        >
          {formula}
        </div>
      ) : null}
    </div>
  );
}

function CompareMetricBlock({ row, cat, onFormulaClick, paired = false }) {
  return (
    <div className={cx("px-3 py-2.5", paired ? "min-w-0" : "border-b border-[rgba(60,40,80,0.18)] last:border-b-0")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {onFormulaClick ? (
            <button
              type="button"
              onClick={onFormulaClick}
              className="truncate text-left text-[11px] font-medium text-[#faf7fd] underline decoration-dotted underline-offset-2 decoration-[#6e6682] hover:text-violet-200"
            >
              {row.name}
            </button>
          ) : (
            <span className="text-[11px] font-medium text-[#faf7fd]">{row.name}</span>
          )}
          <CatBadge type={cat} />
        </div>
        {row.delta ? <DeltaBadge delta={row.delta} /> : null}
      </div>

      {row.note ? (
        <div className="mt-1 text-[9px] italic leading-snug text-[#6b6b6b]" title={row.note}>
          {row.note}
        </div>
      ) : null}

      <div className={cx(COMPARE_BOX, "mt-2 grid grid-cols-2 divide-x divide-[rgba(60,40,80,0.45)]")}>
        <CompareSide
          label="Before"
          value={row.before}
          formula={row.beforeFormula}
          tone="before"
          dim={row.beforeDim}
        />
        <CompareSide
          label="Mini BT"
          value={row.after}
          formula={row.afterFormula}
          tone="after"
          dim={row.afterDim}
        />
      </div>
    </div>
  );
}

function CompareSectionCard({ section, open, onToggle, onGotoFormula }) {
  const allKeys = useMemo(() => section.rows.map((r) => r.key), [section.rows]);
  const [enabledKeys, setEnabledKeys] = useState(() => new Set(allKeys));

  useEffect(() => {
    setEnabledKeys(new Set(allKeys));
  }, [allKeys]);

  const visibleRows = useMemo(
    () => section.rows.filter((r) => enabledKeys.has(r.key)),
    [section.rows, enabledKeys],
  );

  const rowGroups = useMemo(() => chunkPairs(visibleRows), [visibleRows]);

  return (
    <div className={CARD}>
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
              className="grid grid-cols-1 divide-y divide-[rgba(60,40,80,0.18)] border-b border-[rgba(60,40,80,0.18)] last:border-b-0 xl:grid-cols-2 xl:divide-x xl:divide-y-0"
            >
              {rowGroup.map((row) => (
                <CompareMetricBlock
                  key={row.key}
                  row={row}
                  cat={section.cat}
                  paired={rowGroup.length > 1}
                  onFormulaClick={
                    row.formulaId && onGotoFormula ? () => onGotoFormula(row.formulaId) : undefined
                  }
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

function CompareSections({ sections, onGotoFormula }) {
  const sectionKeys = useMemo(() => sections.map((s) => s.key), [sections]);
  const [openSections, setOpenSections] = useState(() => new Set(sectionKeys));

  useEffect(() => {
    setOpenSections(new Set(sectionKeys));
  }, [sectionKeys.join("\0"), sectionKeys]);

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
      {sections.map((section) => (
        <CompareSectionCard
          key={section.key}
          section={section}
          open={openSections.has(section.key)}
          onToggle={() => toggle(section.key)}
          onGotoFormula={onGotoFormula}
        />
      ))}
    </div>
  );
}

function AccountMetricCard({ label, value, valueClassName, detail, detailClassName }) {
  return (
    <div className="min-w-0 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-2.5">
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c]">{label}</div>
      <div className={cx("mt-1 font-mono text-[18px] font-semibold leading-tight", valueClassName || "text-[#f5f5f5]")}>
        {value}
      </div>
      {detail != null && detail !== "" ? (
        <div className={cx("mt-1 font-mono text-[9px]", detailClassName || "text-[#6b6b6b]")}>{detail}</div>
      ) : null}
    </div>
  );
}

function AccountResult({ summary, execCount, totalCount, futures }) {
  const s = summary;
  const equity = s.equity ?? s.finalBalance ?? 0;
  const tradable = s.tradable ?? equity - (s.reserve ?? 0);
  const reserve = s.reserve ?? 0;
  const roiTotal = s.roiTotal ?? s.roi ?? 0;
  const roiTrad = s.roiTradable ?? 0;
  const roiRes = s.roiReserve ?? 0;
  const fees = s.tradeFeesT ?? s.totalFees ?? 0;
  const funding = s.fundingT ?? 0;
  const liqCount = s.liqCount ?? 0;
  const skipped = totalCount - execCount;

  const items = [
    {
      label: "Total balance",
      value: formatMbMoney(equity),
      valueClassName: roiTotal >= 0 ? "text-emerald-400" : "text-red-400",
      detail: formatMbPct(roiTotal),
      detailClassName: roiTotal >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Tradable balance",
      value: formatMbMoney(tradable),
      valueClassName: roiTrad >= 0 ? "text-emerald-400" : "text-red-400",
      detail: formatMbPct(roiTrad),
      detailClassName: roiTrad >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Reserved balance",
      value: formatMbMoney(reserve),
      valueClassName: "text-teal-400",
      detail: `+${roiRes.toFixed(2)}%`,
      detailClassName: "text-teal-400",
    },
    {
      label: "Trading fees",
      value: formatMbMoney(-fees),
      valueClassName: "text-red-400",
    },
    ...(futures
      ? [
          { label: "Funding", value: formatMbMoney(-funding), valueClassName: "text-red-400" },
          {
            label: "Liquidations",
            value: `${liqCount}`,
            valueClassName: liqCount > 0 ? "text-amber-400" : "text-[#f5f5f5]",
            detail: "cycles",
          },
        ]
      : []),
    {
      label: "Executed / Total",
      value: `${execCount} / ${totalCount}`,
      detail: skipped > 0 ? `${skipped} skipped` : undefined,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-medium text-[#f5f5f5]">Account Result</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <AccountMetricCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

export const MiniBacktestComparePairs = memo(function MiniBacktestComparePairs({
  result,
  epochParams = {},
  onGotoFormula,
}) {
  const em = result?.epoch;
  const s = result?.summary;

  const derived = useMemo(() => {
    if (!em || !s) return null;

    const pfBefore = em.pfOHLC === Infinity ? 9.99 : em.pfOHLC ?? 0;
    const pfAfter = (s.pfNet ?? s.profitFactor) === Infinity ? 9.99 : s.pfNet ?? s.profitFactor ?? 0;
    const epochRoi = em.roiOHLC;
    const replayRoi = s.roiTotal ?? s.roi ?? 0;
    const initBal = s.initialBalance ?? 0;
    const epochPnl = epochRoi != null ? initBal * (epochRoi / 100) : null;
    const replayPnl = s.pnlNet ?? s.totalPnL ?? 0;
    const epochMaxDd = em.maxDD;
    const replayMaxDd = s.maxDDTradIntra ?? s.maxDrawdown ?? s.maxDD ?? 0;
    const pcBefore = em.profitCapture;
    const pcAfter = s.profitCaptureExec;
    const futures = (result?.summary?.marketType ?? "") === "futures" || false;
    const execCount =
      s.execCount ?? (result?.rows?.filter?.((r) => ["win", "loss", "liq"].includes(r.status))?.length ?? 0);
    const totalCount = s.totalCount ?? (result?.rows?.length ?? 0);

    const sections = [
      {
        key: "paired",
        cat: "paired",
        title: "Paired — before ↔ after",
        rows: [
          {
            key: "hit",
            formulaId: 39,
            name: "Hit Rate ↔ Win Rate",
            before: `${em.hitRate.toFixed(1)}%`,
            beforeFormula: "count(P_exit > P0) ÷ all cycles",
            after: `${s.winRate.toFixed(1)}%`,
            afterFormula: "count(net > 0) ÷ all cycles",
            delta: buildDelta(em.hitRate, s.winRate, { pp: true }),
          },
          {
            key: "pf",
            formulaId: 40,
            name: "Profit Factor ↔ PF net",
            before: formatMbNum(em.pfOHLC),
            beforeFormula: "Σ winning returns ÷ Σ |losing returns|",
            after: formatMbNum(s.pfNet ?? s.profitFactor),
            afterFormula: "Σ winning net ÷ Σ |losing net|",
            delta: buildDelta(pfBefore, pfAfter),
          },
          {
            key: "pc",
            formulaId: 41,
            name: "Profit Capture ↔ executed",
            before: pcBefore == null ? "—" : formatMbNum(pcBefore),
            beforeFormula: "median( return ÷ MFE )",
            after: pcAfter == null ? "—" : formatMbNum(pcAfter),
            afterFormula: "median( executed return ÷ MFE )",
            delta: pcBefore != null && pcAfter != null ? buildDelta(pcBefore, pcAfter) : null,
          },
          {
            key: "roi",
            formulaId: 32,
            name: "ROI ↔ ROI Total",
            before: epochRoi != null ? formatMbPct(epochRoi) : "—",
            beforeFormula: "(final − start) ÷ start · on 1 unit",
            after: formatMbPct(replayRoi),
            afterFormula: "(Total − start) ÷ start · on real stake",
            note: "Δ not shown — different basis",
          },
          {
            key: "pnl",
            formulaId: 28,
            name: "PnL ↔ Net PnL",
            before: epochPnl != null ? formatMbMoney(epochPnl) : "—",
            beforeFormula: "Σ (P_exit − P0) · on 1 unit",
            after: formatMbMoney(replayPnl),
            afterFormula: "Σ net · on real stake",
            note: "Δ not shown — different basis",
          },
          {
            key: "maxdd",
            formulaId: 36,
            name: "Max Drawdown",
            before: epochMaxDd != null ? `${epochMaxDd.toFixed(2)}%` : "—",
            beforeFormula: "max drop from peak · analyzer balance (1 unit)",
            after: `${Number(replayMaxDd).toFixed(2)}%`,
            afterFormula: "worst intra-cycle drop · tradable balance",
            delta:
              epochMaxDd != null ? buildDelta(epochMaxDd, replayMaxDd, { pp: true, invertTone: true }) : null,
            note: epochMaxDd == null ? "Δ not shown — different basis" : undefined,
          },
        ],
      },
      {
        key: "carried",
        cat: "carried",
        title: "Carried — unchanged",
        rows: [
          {
            key: "medMFE",
            formulaId: 9,
            name: "Median MFE",
            before: formatMbPct(em.medMFE),
            after: formatMbPct(em.medMFE),
            beforeFormula: "median( max_high ÷ P0 − 1 )",
            afterFormula: "median( max_high ÷ P0 − 1 )",
            note: "unchanged — carried",
          },
          {
            key: "medMAE",
            formulaId: 10,
            name: "Median MAE",
            before: formatMbPct(em.medMAE),
            after: formatMbPct(em.medMAE),
            beforeFormula: "median( min_low ÷ P0 − 1 )",
            afterFormula: "median( min_low ÷ P0 − 1 )",
            note: "unchanged — carried",
          },
          {
            key: "medAIR",
            formulaId: 11,
            name: "Median AIR",
            before: formatIntrinsicNum(em.medAIR),
            after: formatIntrinsicNum(em.medAIR),
            beforeFormula: "median( MFE ÷ |MAE|, cap 10 )",
            afterFormula: "median( MFE ÷ |MAE|, cap 10 )",
            note: "unchanged — carried",
          },
          {
            key: "medRet",
            formulaId: 12,
            name: "Median Return",
            before: em.medReturn != null ? formatMbPct(em.medReturn) : "—",
            after: em.medReturn != null ? formatMbPct(em.medReturn) : "—",
            beforeFormula: "median( P_exit ÷ P0 − 1 )",
            afterFormula: "median( P_exit ÷ P0 − 1 )",
            note: "unchanged — carried",
          },
          {
            key: "medDur",
            formulaId: 13,
            name: "Median Duration",
            before: em.medDurC != null ? `${formatIntrinsicNum(em.medDurC, 1)} c` : "—",
            after: em.medDurC != null ? `${formatIntrinsicNum(em.medDurC, 1)} c` : "—",
            beforeFormula: "median( cycle length in candles )",
            afterFormula: "median( cycle length in candles )",
            note: "unchanged — carried",
          },
          {
            key: "medTtMFE",
            formulaId: 42,
            name: "Median Time to MFE",
            before: `${formatIntrinsicNum(em.medTtMfe, 1)} c`,
            after: `${formatIntrinsicNum(em.medTtMfe, 1)} c`,
            beforeFormula: "median( candles to the max high )",
            afterFormula: "median( candles to the max high )",
            note: "unchanged — carried",
          },
          {
            key: "medTtMAE",
            formulaId: 43,
            name: "Median Time to MAE",
            before: `${formatIntrinsicNum(em.medTtMae, 1)} c`,
            after: `${formatIntrinsicNum(em.medTtMae, 1)} c`,
            beforeFormula: "median( candles to the min low )",
            afterFormula: "median( candles to the min low )",
            note: "unchanged — carried",
          },
        ],
      },
      {
        key: "nopair",
        cat: "nopair",
        title: "No-pair",
        rows: [
          {
            key: "cagr",
            formulaId: 37,
            name: "CAGR",
            before: "—",
            beforeFormula: "no analyzer counterpart",
            beforeDim: true,
            after: em.cagr != null ? formatMbPct(em.cagr) : "—",
            afterFormula: "(Total ÷ start)^(1/years) − 1",
            note: "new metric — no before",
          },
          {
            key: "calmar",
            formulaId: 38,
            name: "Calmar",
            before: "—",
            beforeFormula: "no analyzer counterpart",
            beforeDim: true,
            after: formatIntrinsicNum(em.calmar),
            afterFormula: "CAGR ÷ |Max Drawdown (intra-cycle)|",
            note: "new metric — no before",
          },
          {
            key: "fs",
            formulaId: "FS",
            name: "Final Score",
            before: formatIntrinsicNum(epochParams.score ?? em.finalScore),
            beforeFormula: "analyzer quality score",
            after: "—",
            afterDim: true,
            afterFormula: "",
            note: "analyzer-only — not recomputed",
          },
          {
            key: "ss",
            formulaId: "SS",
            name: "Stability Score",
            before: formatIntrinsicNum(epochParams.stability ?? em.stabilityScore),
            beforeFormula: "analyzer stability score",
            after: "—",
            afterDim: true,
            afterFormula: "",
            note: "analyzer-only — not recomputed",
          },
        ],
      },
    ];

    return { sections, execCount, totalCount, futures };
  }, [em, s, result, epochParams]);

  if (!derived) return null;

  const { sections, execCount, totalCount, futures } = derived;

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-[#8c8c8c]">
        How much of the theoretical epoch quality survives real money-management. Grouped and ordered
        exactly like{" "}
        {onGotoFormula ? (
          <button
            type="button"
            onClick={() => onGotoFormula(1)}
            className="text-violet-400 underline decoration-dotted underline-offset-2 transition-colors hover:text-violet-300"
          >
            Formula Reference
          </button>
        ) : (
          "Formula Reference"
        )}
        .
      </p>

      <AccountResult summary={s} execCount={execCount} totalCount={totalCount} futures={futures} />

      <CompareSections sections={sections} onGotoFormula={onGotoFormula} />
    </div>
  );
});
