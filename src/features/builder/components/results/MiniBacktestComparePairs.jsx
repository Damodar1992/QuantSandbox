import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { formatMbMoney, formatMbNum, formatMbPct } from "../../utils/miniBacktestDisplay";

/* ─── helpers ─────────────────────────────────────────────────────────── */
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

/* ─── Value cell (left or right column) ────────────────────────────────
 * BEFORE:  [formula ........] [value ▸]   — values right-aligned toward center
 * AFTER:   [◂ value] [formula ........]   — values left-aligned toward center
 * CSS grid + fixed value track + tabular-nums → same columns on every row.
 */
const VALUE_COL = "8rem";

function ValueCell({ value, formula, tone, dim }) {
  const isBefore = tone === "before";
  return (
    <div
      className="grid min-w-0 items-center gap-2.5 whitespace-nowrap px-3 py-2.5"
      style={{
        gridTemplateColumns: isBefore
          ? `minmax(0,1fr) ${VALUE_COL}`
          : `${VALUE_COL} minmax(0,1fr)`,
      }}
    >
      {isBefore ? (
        <>
          <div
            className="min-w-0 truncate text-left font-mono text-[9px] leading-none text-blue-300/50"
            title={formula || undefined}
          >
            {formula || "\u00A0"}
          </div>
          <div
            className={cx(
              "text-right font-mono text-[18px] font-bold leading-none tabular-nums",
              dim ? "text-[#4a4a5a]" : "text-[#faf7fd]",
            )}
          >
            {value}
          </div>
        </>
      ) : (
        <>
          <div
            className={cx(
              "text-left font-mono text-[18px] font-bold leading-none tabular-nums",
              dim ? "text-[#4a4a5a]" : "text-[#faf7fd]",
            )}
          >
            {value}
          </div>
          <div
            className="min-w-0 truncate text-right font-mono text-[9px] leading-none text-violet-300/50"
            title={formula || undefined}
          >
            {formula || "\u00A0"}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Delta badge ─────────────────────────────────────────────────────── */
function DeltaBadge({ delta }) {
  if (!delta) return null;
  const tone = delta.positive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                              : "text-red-400 bg-red-500/10 border-red-500/25";
  return (
    <span className={cx("inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0 whitespace-nowrap tabular-nums", tone)}>
      <span>{delta.positive ? "▲" : "▼"}</span>
      <span>{delta.primary}</span>
    </span>
  );
}

/* ─── Category badge ──────────────────────────────────────────────────── */
function CatBadge({ type }) {
  if (type === "paired") return (
    <span className="inline-flex items-center rounded px-1 py-px text-[8px] font-bold border bg-violet-500/10 text-violet-300 border-violet-500/25 whitespace-nowrap">🔁 Paired</span>
  );
  if (type === "carried") return (
    <span className="inline-flex items-center rounded px-1 py-px text-[8px] font-bold border bg-teal-500/10 text-teal-300 border-teal-500/25 whitespace-nowrap">＝ Carried</span>
  );
  return (
    <span className="inline-flex items-center rounded px-1 py-px text-[8px] font-bold border bg-[#1f1f30] text-[#8c8c8c] border-[rgba(60,40,80,0.4)] whitespace-nowrap">— No-pair</span>
  );
}

/* ─── 3-column comparison row ─────────────────────────────────────────── */
function CompareRow({ name, cat, before, beforeFormula, beforeDim, after, afterFormula, afterDim, delta, note, onFormulaClick }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)] items-center border-b border-[rgba(60,40,80,0.2)] last:border-b-0">
      {/* Left: BEFORE — formula left, value right (toward center) */}
      <div className="min-w-0 border-r border-[rgba(60,40,80,0.2)] bg-blue-500/[0.03]">
        <ValueCell value={before} formula={beforeFormula} tone="before" dim={beforeDim} />
      </div>

      {/* Center: name + badges + delta */}
      <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 text-center bg-[#0d0718]/40">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
          {onFormulaClick ? (
            <button
              type="button"
              onClick={onFormulaClick}
              className="max-w-full truncate whitespace-nowrap text-[12px] font-bold text-[#e8e0f0] hover:text-violet-300 transition-colors underline decoration-dotted underline-offset-2"
            >
              {name}
            </button>
          ) : (
            <span className="max-w-full truncate whitespace-nowrap text-[12px] font-bold text-[#e8e0f0]">{name}</span>
          )}
          <CatBadge type={cat} />
        </div>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
          {delta ? <DeltaBadge delta={delta} /> : null}
          {note ? (
            <span className="max-w-full truncate text-[9px] text-[#6b6b6b] italic" title={note}>
              {note}
            </span>
          ) : null}
        </div>
      </div>

      {/* Right: AFTER — value left (toward center), formula right */}
      <div className="min-w-0 border-l border-[rgba(60,40,80,0.2)] bg-violet-500/[0.03]">
        <ValueCell value={after} formula={afterFormula} tone="after" dim={afterDim} />
      </div>
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────────────── */
function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#0d0718]/60 border-b border-[rgba(60,40,80,0.3)]">
      <span className="text-[11px] font-bold text-[#d9d9d9]">{label}</span>
      <span className="rounded-full bg-[#1a1028] border border-[rgba(60,40,80,0.45)] px-2 py-px text-[9px] text-[#8c8c8c]">{count}</span>
    </div>
  );
}

function DetailedCompareTable({ pairedRows, carriedRows, noPairRows, onGotoFormula }) {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)] border-b border-[rgba(60,40,80,0.3)]">
        <div
          className="grid items-center gap-2.5 px-3 py-2 bg-blue-500/[0.05] border-r border-[rgba(60,40,80,0.2)]"
          style={{ gridTemplateColumns: `minmax(0,1fr) ${VALUE_COL}` }}
        >
          <span className="min-w-0 truncate text-left text-[9px] font-bold uppercase tracking-wider text-blue-300/50 whitespace-nowrap">
            Formula
          </span>
          <span className="text-right text-[9px] font-bold uppercase tracking-wider text-blue-300/70 whitespace-nowrap">
            BEFORE
          </span>
        </div>
        <div className="px-3 py-2 bg-[#0d0718]/40 text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] whitespace-nowrap">Δ · what moved it</span>
        </div>
        <div
          className="grid items-center gap-2.5 px-3 py-2 bg-violet-500/[0.05] border-l border-[rgba(60,40,80,0.2)]"
          style={{ gridTemplateColumns: `${VALUE_COL} minmax(0,1fr)` }}
        >
          <span className="text-left text-[9px] font-bold uppercase tracking-wider text-violet-300/70 whitespace-nowrap">
            Mini BT
          </span>
          <span className="min-w-0 truncate text-right text-[9px] font-bold uppercase tracking-wider text-violet-300/50 whitespace-nowrap">
            Formula
          </span>
        </div>
      </div>

      <SectionHeader label="🔁 Paired — before ↔ after" count={pairedRows.length} />
      {pairedRows.map((row) => (
        <CompareRow
          key={row.key}
          cat="paired"
          {...row}
          onFormulaClick={row.formulaId && onGotoFormula ? () => onGotoFormula(row.formulaId) : undefined}
        />
      ))}

      <SectionHeader label="＝ Carried — unchanged" count={carriedRows.length} />
      {carriedRows.map((row) => (
        <CompareRow
          key={row.key}
          cat="carried"
          name={row.name}
          before={row.value}
          beforeFormula={row.formula}
          after={row.value}
          afterFormula={row.formula}
          note="unchanged — carried"
          onFormulaClick={row.formulaId && onGotoFormula ? () => onGotoFormula(row.formulaId) : undefined}
        />
      ))}

      <SectionHeader label="— No-pair" count={noPairRows.length} />
      {noPairRows.map((row) => (
        <CompareRow
          key={row.key}
          cat="nopair"
          name={row.name}
          before={row.before}
          beforeFormula={row.beforeFormula}
          beforeDim={row.beforeDim}
          after={row.after}
          afterFormula={row.afterFormula}
          afterDim={row.afterDim}
          note={row.note}
          onFormulaClick={row.formulaId && onGotoFormula ? () => onGotoFormula(row.formulaId) : undefined}
        />
      ))}
    </>
  );
}

/* ─── Account Result — same MetricCard style as MiniBacktestDashboard ─── */
function AccountMetricCard({ label, value, valueClassName, detail, detailClassName }) {
  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-2.5 min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c]">{label}</div>
      <div className={cx("mt-1 text-[18px] font-semibold font-mono leading-tight", valueClassName || "text-[#f5f5f5]")}>
        {value}
      </div>
      {detail != null && detail !== "" ? (
        <div className={cx("text-[9px] mt-1 font-mono", detailClassName || "text-[#6b6b6b]")}>{detail}</div>
      ) : null}
    </div>
  );
}

function AccountResult({ summary, execCount, totalCount, futures }) {
  const s = summary;
  const equity    = s.equity ?? s.finalBalance ?? 0;
  const tradable  = s.tradable ?? equity - (s.reserve ?? 0);
  const reserve   = s.reserve ?? 0;
  const roiTotal  = s.roiTotal ?? s.roi ?? 0;
  const roiTrad   = s.roiTradable ?? 0;
  const roiRes    = s.roiReserve ?? 0;
  const fees      = s.tradeFeesT ?? s.totalFees ?? 0;
  const funding   = s.fundingT ?? 0;
  const liqCount  = s.liqCount ?? 0;
  const skipped   = totalCount - execCount;

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {items.map((item) => (
          <AccountMetricCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export const MiniBacktestComparePairs = memo(function MiniBacktestComparePairs({
  result,
  epochParams = {},
  onGotoFormula,
}) {
  const em = result?.epoch;
  const s = result?.summary;
  if (!em || !s) return null;

  const pfBefore = em.pfOHLC === Infinity ? 9.99 : em.pfOHLC ?? 0;
  const pfAfter  = (s.pfNet ?? s.profitFactor) === Infinity ? 9.99 : s.pfNet ?? s.profitFactor ?? 0;
  const epochRoi   = em.roiOHLC;
  const replayRoi  = s.roiTotal ?? s.roi ?? 0;
  const initBal    = s.initialBalance ?? 0;
  const epochPnl   = epochRoi != null ? initBal * (epochRoi / 100) : null;
  const replayPnl  = s.pnlNet ?? s.totalPnL ?? 0;
  const epochMaxDd = em.maxDD;
  const replayMaxDd = s.maxDDTradIntra ?? s.maxDrawdown ?? s.maxDD ?? 0;
  const pcBefore   = em.profitCapture;
  const pcAfter    = s.profitCaptureExec;
  const futures    = (result?.summary?.marketType ?? "") === "futures" || false;

  const execCount  = s.execCount ?? (result?.rows?.filter?.((r) => ["win", "loss", "liq"].includes(r.status))?.length ?? 0);
  const totalCount = s.totalCount ?? (result?.rows?.length ?? 0);

  // ── PAIRED rows ──────────────────────────────────────────────────────
  const pairedRows = [
    {
      key: "hit", formulaId: 39,
      name: "Hit Rate ↔ Win Rate",
      before: `${em.hitRate.toFixed(1)}%`,  beforeFormula: "count(P_exit > P0) ÷ all cycles",
      after:  `${s.winRate.toFixed(1)}%`,   afterFormula:  "count(net > 0) ÷ all cycles",
      delta: buildDelta(em.hitRate, s.winRate, { pp: true }),
    },
    {
      key: "pf", formulaId: 40,
      name: "Profit Factor ↔ PF net",
      before: formatMbNum(em.pfOHLC),                    beforeFormula: "Σ winning returns ÷ Σ |losing returns|",
      after:  formatMbNum(s.pfNet ?? s.profitFactor),    afterFormula:  "Σ winning net ÷ Σ |losing net|",
      delta: buildDelta(pfBefore, pfAfter),
    },
    {
      key: "pc", formulaId: 41,
      name: "Profit Capture ↔ executed",
      before: pcBefore == null ? "—" : formatMbNum(pcBefore), beforeFormula: "median( return ÷ MFE )",
      after:  pcAfter  == null ? "—" : formatMbNum(pcAfter),  afterFormula:  "median( executed return ÷ MFE )",
      delta: pcBefore != null && pcAfter != null ? buildDelta(pcBefore, pcAfter) : null,
    },
    {
      key: "roi", formulaId: 32,
      name: "ROI ↔ ROI Total",
      before: epochRoi != null ? formatMbPct(epochRoi) : "—", beforeFormula: "(final − start) ÷ start · on 1 unit",
      after:  formatMbPct(replayRoi),                          afterFormula:  "(Total − start) ÷ start · on real stake",
      note: "Δ not shown — different basis",
    },
    {
      key: "pnl", formulaId: 28,
      name: "PnL ↔ Net PnL",
      before: epochPnl != null ? formatMbMoney(epochPnl) : "—", beforeFormula: "Σ (P_exit − P0) · on 1 unit",
      after:  formatMbMoney(replayPnl),                          afterFormula:  "Σ net · on real stake",
      note: "Δ not shown — different basis",
    },
    {
      key: "maxdd", formulaId: 36,
      name: "Max Drawdown",
      before: epochMaxDd != null ? `${epochMaxDd.toFixed(2)}%` : "—",
      beforeFormula: "max drop from peak · analyzer balance (1 unit)",
      after: `${Number(replayMaxDd).toFixed(2)}%`,
      afterFormula:  "worst intra-cycle drop · tradable balance",
      delta: epochMaxDd != null ? buildDelta(epochMaxDd, replayMaxDd, { pp: true, invertTone: true }) : null,
      note: epochMaxDd == null ? "Δ not shown — different basis" : undefined,
    },
  ];

  // ── CARRIED rows ─────────────────────────────────────────────────────
  const carriedRows = [
    { key: "medMFE",     formulaId: 9,  name: "Median MFE",         value: formatMbPct(em.medMFE),                                        formula: "median( max_high ÷ P0 − 1 )" },
    { key: "medMAE",     formulaId: 10, name: "Median MAE",         value: formatMbPct(em.medMAE),                                        formula: "median( min_low ÷ P0 − 1 )" },
    { key: "medAIR",     formulaId: 11, name: "Median AIR",         value: formatIntrinsicNum(em.medAIR),                                 formula: "median( MFE ÷ |MAE|, cap 10 )" },
    { key: "medRet",     formulaId: 12, name: "Median Return",      value: em.medReturn != null ? formatMbPct(em.medReturn) : "—",        formula: "median( P_exit ÷ P0 − 1 )" },
    { key: "medDur",     formulaId: 13, name: "Median Duration",    value: em.medDurC != null ? `${formatIntrinsicNum(em.medDurC, 1)} c` : "—", formula: "median( cycle length in candles )" },
    { key: "medTtMFE",   formulaId: 42, name: "Median Time to MFE", value: `${formatIntrinsicNum(em.medTtMfe, 1)} c`,                     formula: "median( candles to the max high )" },
    { key: "medTtMAE",   formulaId: 43, name: "Median Time to MAE", value: `${formatIntrinsicNum(em.medTtMae, 1)} c`,                     formula: "median( candles to the min low )" },
  ];

  // ── NO-PAIR rows ──────────────────────────────────────────────────────
  const noPairRows = [
    {
      key: "cagr",    formulaId: 37,
      name: "CAGR",
      before: "—", beforeFormula: "no analyzer counterpart", beforeDim: true,
      after: em.cagr != null ? formatMbPct(em.cagr) : "—", afterFormula: "(Total ÷ start)^(1/years) − 1",
      note: "new metric — no before",
    },
    {
      key: "calmar",  formulaId: 38,
      name: "Calmar",
      before: "—", beforeFormula: "no analyzer counterpart", beforeDim: true,
      after: formatIntrinsicNum(em.calmar), afterFormula: "CAGR ÷ |Max Drawdown (intra-cycle)|",
      note: "new metric — no before",
    },
    {
      key: "fs",      formulaId: "FS",
      name: "Final Score",
      before: formatIntrinsicNum(epochParams.score ?? em.finalScore), beforeFormula: "analyzer quality score",
      after: "—", afterDim: true, afterFormula: "",
      note: "analyzer-only — not recomputed",
    },
    {
      key: "ss",      formulaId: "SS",
      name: "Stability Score",
      before: formatIntrinsicNum(epochParams.stability ?? em.stabilityScore), beforeFormula: "analyzer stability score",
      after: "—", afterDim: true, afterFormula: "",
      note: "analyzer-only — not recomputed",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Description */}
      <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
        How much of the theoretical epoch quality survives real money-management.
        Grouped and ordered exactly like{" "}
        {onGotoFormula ? (
          <button
            type="button"
            onClick={() => onGotoFormula(1)}
            className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
          >
            Formula Reference
          </button>
        ) : (
          "Formula Reference"
        )}
        .
      </p>

      {/* Account Result */}
      <AccountResult
        summary={s}
        execCount={execCount}
        totalCount={totalCount}
        futures={futures}
      />

      {/* Comparison table */}
      <div className="rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-x-auto">
        <div className="min-w-[720px]">
          <DetailedCompareTable
            pairedRows={pairedRows}
            carriedRows={carriedRows}
            noPairRows={noPairRows}
            onGotoFormula={onGotoFormula}
          />
        </div>
      </div>
    </div>
  );
});
