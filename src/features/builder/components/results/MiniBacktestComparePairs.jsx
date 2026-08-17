import React, { memo, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cx, ui } from "../../../../constants/ui";
import { formatMbMoney, formatMbNum, formatMbPct } from "../../utils/miniBacktestDisplay";

const METRIC_CARD = cx(ui.radius, "h-full min-w-0 border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-4");
const DELTA_NA = { primary: "Δ n/a", tone: "na" };

function buildDelta(before, after, { pp = false, invertTone = false, money = false } = {}) {
  if (before == null || after == null || Number.isNaN(before) || Number.isNaN(after)) return null;
  const diff = after - before;
  if (Number.isNaN(diff)) return null;

  let primary;
  if (money) primary = formatMbMoney(diff);
  else if (pp) primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pp`;
  else primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`;

  const eps = pp ? 0.05 : money ? 0.5 : 0.005;
  if (Math.abs(diff) < eps) return { primary, tone: "neutral" };

  if (invertTone) return { primary, tone: diff <= 0 ? "invert-good" : "down" };
  return { primary, tone: diff >= 0 ? "up" : "down" };
}

function formatIntrinsicNum(val, decimals = 2) {
  if (val == null || Number.isNaN(val)) return "—";
  if (val === Infinity) return "∞";
  if (val === -Infinity) return "−∞";
  return formatMbNum(val, decimals);
}

const DELTA_TONE = {
  up: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  down: "border-red-500/25 bg-red-500/10 text-red-400",
  "invert-good": "border-teal-500/30 bg-teal-500/10 text-teal-300",
  neutral: "border-[rgba(60,40,80,0.4)] bg-[#1a1428] text-[#8c8c8c]",
  na: "border-[rgba(60,40,80,0.4)] bg-[#1a1428] text-[#8c8c8c]",
};

function deltaMark(tone) {
  if (tone === "up") return "▲";
  if (tone === "down" || tone === "invert-good") return "▼";
  if (tone === "na") return null;
  return "–";
}

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const mark = deltaMark(delta.tone);
  return (
    <Badge
      variant="outline"
      className={cx(
        "h-auto gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
        DELTA_TONE[delta.tone] || DELTA_TONE.neutral,
      )}
    >
      {mark ? <span>{mark}</span> : null}
      <span>{delta.primary}</span>
    </Badge>
  );
}

function OnlyInBadge({ side }) {
  const isMini = side === "mini";
  return (
    <Badge
      variant="outline"
      className={cx(
        "h-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        isMini
          ? "border-teal-500/30 bg-teal-500/10 text-teal-300"
          : "border-violet-500/30 bg-violet-500/10 text-violet-300",
      )}
    >
      {isMini ? "Mini BT only" : "Hyperopt only"}
    </Badge>
  );
}

function UnchangedBadge() {
  return (
    <Badge
      variant="outline"
      className="h-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border-teal-500/30 bg-teal-500/10 text-teal-300"
    >
      Unchanged
    </Badge>
  );
}

function MetricTitle({ name, onFormulaClick }) {
  const className = "block w-full truncate text-left text-[13px] font-medium text-[#faf7fd]";
  if (!onFormulaClick) {
    return <span className={className}>{name}</span>;
  }
  return (
    <button type="button" onClick={onFormulaClick} className={cx(className, "hover:text-violet-200")}>
      {name}
    </button>
  );
}

function FormulaLine({ text, align = "left" }) {
  if (!text) return null;
  return (
    <div
      className={cx("mt-2 flex min-w-0 items-start gap-1.5", align === "right" && "justify-end")}
      title={text}
    >
      <span className="mt-px shrink-0 font-serif text-[12px] italic leading-none text-emerald-400/80">ƒ</span>
      <span
        className={cx(
          "min-w-0 break-words font-mono text-[10px] leading-snug text-[#6e6682]",
          align === "right" && "text-right",
        )}
      >
        {text}
      </span>
    </div>
  );
}

function CompareValues({ before, after, beforeDim, afterDim, beforeFormula, afterFormula }) {
  return (
    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
      <div className="min-w-0">
        <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">Hyperopt</div>
        <div
          className={cx(
            "mt-1 truncate font-mono text-[20px] font-semibold tabular-nums leading-none",
            beforeDim ? "text-[#4a4a5a]" : "text-[#faf7fd]",
          )}
        >
          {before}
        </div>
        <FormulaLine text={beforeFormula} />
      </div>
      <span className="mt-5 text-[16px] text-[#6e6682]" aria-hidden>
        →
      </span>
      <div className="min-w-0 text-right">
        <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">Mini BT</div>
        <div
          className={cx(
            "mt-1 truncate font-mono text-[20px] font-semibold tabular-nums leading-none",
            afterDim ? "text-[#4a4a5a]" : "text-[#faf7fd]",
          )}
        >
          {after}
        </div>
        <FormulaLine text={afterFormula} align="right" />
      </div>
    </div>
  );
}

function PairedMetricCard({ row, onFormulaClick }) {
  const comparable = row.comparable !== false;
  return (
    <div className={METRIC_CARD}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <MetricTitle name={row.name} onFormulaClick={onFormulaClick} />
        </div>
        <DeltaBadge delta={row.delta} />
      </div>
      <div className="mt-1 text-[11px] text-[#6e6682]">
        {comparable ? "same basis • comparable" : "different basis • not comparable"}
      </div>
      <CompareValues
        before={row.before}
        after={row.after}
        beforeDim={row.beforeDim}
        afterDim={row.afterDim}
        beforeFormula={row.beforeFormula}
        afterFormula={row.afterFormula}
      />
    </div>
  );
}

function CarriedMetricCard({ row, onFormulaClick }) {
  const value = row.after ?? row.before;
  const formula = row.afterFormula || row.beforeFormula;
  return (
    <div className={METRIC_CARD}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <MetricTitle name={row.name} onFormulaClick={onFormulaClick} />
        </div>
        <UnchangedBadge />
      </div>
      <div className="mt-1 text-[11px] text-[#6e6682]">same basis • carried</div>
      <CompareValues
        before={row.before ?? value}
        after={row.after ?? value}
        beforeFormula={row.beforeFormula || formula}
        afterFormula={row.afterFormula || formula}
      />
    </div>
  );
}

function NoPairMetricCard({ row, onFormulaClick }) {
  return (
    <div className={METRIC_CARD}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <MetricTitle name={row.name} onFormulaClick={onFormulaClick} />
        </div>
        {row.onlyIn ? <OnlyInBadge side={row.onlyIn} /> : null}
      </div>
      <CompareValues
        before={row.before}
        after={row.after}
        beforeDim={row.beforeDim}
        afterDim={row.afterDim}
        beforeFormula={row.beforeFormula}
        afterFormula={row.afterFormula}
      />
    </div>
  );
}

function sectionHint(section) {
  if (section.cat === "paired") {
    const comparable = section.rows.filter((r) => r.comparable !== false).length;
    const noBase = section.rows.length - comparable;
    return `${comparable} comparable • ${noBase} without a common basis`;
  }
  if (section.cat === "carried") return "same value in both runs";
  return "exists in one run only";
}

function CompareSection({ section, onGotoFormula }) {
  const [open, setOpen] = useState(true);
  const Card =
    section.cat === "carried" ? CarriedMetricCard : section.cat === "nopair" ? NoPairMetricCard : PairedMetricCard;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left hover:opacity-90"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-[#8c8c8c] transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#faf7fd]">
            {section.title}
          </span>
        </span>
        <span className="shrink-0 text-[11px] text-[#6e6682]">{sectionHint(section)}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {section.rows.map((row) => (
            <Card
              key={row.key}
              row={row}
              onFormulaClick={row.formulaId && onGotoFormula ? () => onGotoFormula(row.formulaId) : undefined}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CompareSections({ sections, onGotoFormula }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <CompareSection key={section.key} section={section} onGotoFormula={onGotoFormula} />
      ))}
    </div>
  );
}

function AccountMetricCard({ label, value, valueClassName, detail }) {
  return (
    <div className={cx(ui.radius, "min-w-0 space-y-1.5 border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3")}>
      <div className="text-[10px] leading-snug text-[#8c8c8c]">{label}</div>
      <div
        className={cx(
          "font-mono text-[22px] font-semibold tabular-nums leading-none",
          valueClassName || "text-[#d9d9d9]",
        )}
      >
        {value}
      </div>
      {detail != null && detail !== "" ? (
        <div className={cx("text-[10px] leading-snug", ui.textSubtle)}>{detail}</div>
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
      valueClassName: roiTotal >= 0 ? "text-green-400" : "text-red-400",
      detail: formatMbPct(roiTotal),
    },
    {
      label: "Tradable balance",
      value: formatMbMoney(tradable),
      valueClassName: roiTrad >= 0 ? "text-green-400" : "text-red-400",
      detail: formatMbPct(roiTrad),
    },
    {
      label: "Reserved balance",
      value: formatMbMoney(reserve),
      valueClassName: "text-teal-400",
      detail: `+${roiRes.toFixed(2)}%`,
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
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">Account result</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        title: "Paired",
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
            delta: pcBefore != null && pcAfter != null ? buildDelta(pcBefore, pcAfter) : DELTA_NA,
            comparable: pcBefore != null && pcAfter != null,
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
              epochMaxDd != null
                ? buildDelta(epochMaxDd, replayMaxDd, { pp: true, invertTone: true })
                : DELTA_NA,
            comparable: epochMaxDd != null,
          },
          {
            key: "roi",
            formulaId: 32,
            name: "ROI ↔ ROI Total",
            before: epochRoi != null ? formatMbPct(epochRoi) : "—",
            beforeFormula: "(final − start) ÷ start · on 1 unit",
            after: formatMbPct(replayRoi),
            afterFormula: "(Total − start) ÷ start · on real stake",
            delta: DELTA_NA,
            comparable: false,
          },
          {
            key: "pnl",
            formulaId: 28,
            name: "PnL ↔ Net PnL",
            before: epochPnl != null ? formatMbMoney(epochPnl) : "—",
            beforeFormula: "Σ (P_exit − P0) · on 1 unit",
            after: formatMbMoney(replayPnl),
            afterFormula: "Σ net · on real stake",
            delta: DELTA_NA,
            comparable: false,
          },
        ],
      },
      {
        key: "carried",
        cat: "carried",
        title: "Carried",
        rows: [
          {
            key: "medMFE",
            formulaId: 9,
            name: "Median MFE",
            before: formatMbPct(em.medMFE),
            after: formatMbPct(em.medMFE),
            beforeFormula: "median( max_high ÷ P0 − 1 )",
            afterFormula: "median( max_high ÷ P0 − 1 )",
          },
          {
            key: "medMAE",
            formulaId: 10,
            name: "Median MAE",
            before: formatMbPct(em.medMAE),
            after: formatMbPct(em.medMAE),
            beforeFormula: "median( min_low ÷ P0 − 1 )",
            afterFormula: "median( min_low ÷ P0 − 1 )",
          },
          {
            key: "medAIR",
            formulaId: 11,
            name: "Median AIR",
            before: formatIntrinsicNum(em.medAIR),
            after: formatIntrinsicNum(em.medAIR),
            beforeFormula: "median( MFE ÷ |MAE|, cap 10 )",
            afterFormula: "median( MFE ÷ |MAE|, cap 10 )",
          },
          {
            key: "medRet",
            formulaId: 12,
            name: "Median Return",
            before: em.medReturn != null ? formatMbPct(em.medReturn) : "—",
            after: em.medReturn != null ? formatMbPct(em.medReturn) : "—",
            beforeFormula: "median( P_exit ÷ P0 − 1 )",
            afterFormula: "median( P_exit ÷ P0 − 1 )",
          },
          {
            key: "medDur",
            formulaId: 13,
            name: "Median Duration",
            before: em.medDurC != null ? `${formatIntrinsicNum(em.medDurC, 1)} c` : "—",
            after: em.medDurC != null ? `${formatIntrinsicNum(em.medDurC, 1)} c` : "—",
            beforeFormula: "median( cycle length in candles )",
            afterFormula: "median( cycle length in candles )",
          },
          {
            key: "medTtMFE",
            formulaId: 42,
            name: "Median Time to MFE",
            before: `${formatIntrinsicNum(em.medTtMfe, 1)} c`,
            after: `${formatIntrinsicNum(em.medTtMfe, 1)} c`,
            beforeFormula: "median( candles to the max high )",
            afterFormula: "median( candles to the max high )",
          },
          {
            key: "medTtMAE",
            formulaId: 43,
            name: "Median Time to MAE",
            before: `${formatIntrinsicNum(em.medTtMae, 1)} c`,
            after: `${formatIntrinsicNum(em.medTtMae, 1)} c`,
            beforeFormula: "median( candles to the min low )",
            afterFormula: "median( candles to the min low )",
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
            beforeDim: true,
            after: em.cagr != null ? formatMbPct(em.cagr) : "—",
            afterFormula: "(Total ÷ start)^(1/years) − 1",
            onlyIn: "mini",
          },
          {
            key: "calmar",
            formulaId: 38,
            name: "Calmar",
            before: "—",
            beforeDim: true,
            after: formatIntrinsicNum(em.calmar),
            afterFormula: "CAGR ÷ |Max Drawdown (intra-cycle)|",
            onlyIn: "mini",
          },
          {
            key: "fs",
            formulaId: "FS",
            name: "Final Score",
            before: formatIntrinsicNum(epochParams.score ?? em.finalScore),
            beforeFormula: "analyzer quality score",
            after: "—",
            afterDim: true,
            onlyIn: "hyperopt",
          },
          {
            key: "ss",
            formulaId: "SS",
            name: "Stability Score",
            before: formatIntrinsicNum(epochParams.stability ?? em.stabilityScore),
            beforeFormula: "analyzer stability score",
            after: "—",
            afterDim: true,
            onlyIn: "hyperopt",
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
