import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { formatMbMoney, formatMbNum, formatMbPct } from "../../utils/miniBacktestDisplay";

const CARD_CLASS =
  "rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-2.5 py-2 min-w-0";

function buildDelta(before, after, { unit = "", pp = false, invertTone = false, money = false } = {}) {
  if (before == null || after == null || Number.isNaN(before) || Number.isNaN(after)) return null;

  const diff = after - before;
  if (Number.isNaN(diff)) return null;

  const positive = invertTone ? diff <= 0 : diff >= 0;
  let primary;

  if (money) {
    primary = formatMbMoney(diff);
  } else if (pp) {
    primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pp`;
  } else if (unit) {
    primary = `${diff >= 0 ? "+" : ""}${Math.abs(diff).toFixed(2)}${unit}`;
  } else {
    primary = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`;
  }

  let secondary = null;
  if (before !== 0) {
    const pct = (diff / Math.abs(before)) * 100;
    secondary = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  }

  return { primary, secondary, positive };
}

function SectionBadge({ tone, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border",
        tone === "before" && "bg-blue-500/10 text-blue-300 border-blue-500/30",
        tone === "after" && "bg-violet-500/10 text-violet-300 border-violet-500/30",
        tone === "path" && "bg-[#2a2a2a] text-[#8c8c8c] border-[rgba(60,40,80,0.45)]",
        tone === "carried" && "bg-teal-500/10 text-teal-300 border-teal-500/30",
        tone === "nopair" && "bg-amber-500/10 text-amber-300 border-amber-500/30",
      )}
    >
      {children}
    </span>
  );
}

function CompactValue({ tone, value, formula }) {
  return (
    <div
      className={cx(
        "rounded-md border px-2 py-1.5 min-w-0",
        tone === "before" && "border-blue-500/15 bg-blue-500/[0.05]",
        tone === "after" && "border-violet-500/15 bg-violet-500/[0.05]",
      )}
    >
      <div
        className={cx(
          "text-[8px] font-bold uppercase tracking-wider mb-0.5",
          tone === "before" ? "text-blue-300/80" : "text-violet-300/80",
        )}
      >
        {tone === "before" ? "Before" : "After"}
      </div>
      <div className="text-[13px] font-semibold font-mono text-[#faf7fd] leading-none truncate">{value}</div>
      {formula ? (
        <div className="mt-0.5 text-[8px] text-[#6b6b6b] font-mono leading-tight line-clamp-2" title={formula}>
          {formula}
        </div>
      ) : null}
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (!delta) {
    return <span className="text-[9px] font-mono text-[#6b6b6b] shrink-0">—</span>;
  }

  const tone = delta.positive ? "text-emerald-400" : "text-red-400";
  const bg = delta.positive ? "bg-emerald-500/10 border-emerald-500/25" : "bg-red-500/10 border-red-500/25";

  return (
    <div className={cx("shrink-0 rounded border px-1.5 py-0.5 max-w-[120px]", bg)}>
      <div className={cx("font-mono text-[9px] font-bold leading-tight", tone)}>
        <span className="inline-flex items-center gap-0.5">
          <span aria-hidden>{delta.positive ? "▲" : "▼"}</span>
          <span className="truncate">{delta.primary}</span>
        </span>
        {delta.secondary ? (
          <div className="text-[8px] font-semibold opacity-90 truncate">{delta.secondary}</div>
        ) : null}
      </div>
    </div>
  );
}

function CompareMetricCard({ name, before, beforeFormula, after, afterFormula, delta }) {
  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#170f29] px-2.5 py-2 min-w-0 flex flex-col gap-1.5 h-full">
      <div className="flex items-start justify-between gap-1.5 min-h-[28px]">
        <div className="text-[10px] font-semibold text-[#e8e0f0] leading-snug min-w-0 line-clamp-2">{name}</div>
        <DeltaBadge delta={delta} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <CompactValue tone="before" value={before} formula={beforeFormula} />
        <CompactValue tone="after" value={after} formula={afterFormula} />
      </div>
    </div>
  );
}

function IntrinsicMetricCard({ name, value, formula }) {
  return (
    <div className={cx(CARD_CLASS, "border-l-2 border-l-[rgba(60,40,80,0.45)]")}>
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c] truncate">{name}</div>
      <div className="mt-1 text-[13px] font-bold font-mono text-[#d9d9d9]">{value}</div>
      {formula ? (
        <div className="mt-1 text-[8px] text-[#6b6b6b] font-mono leading-snug line-clamp-2" title={formula}>
          {formula}
        </div>
      ) : null}
    </div>
  );
}

function IntrinsicSection({ tone, title, subtitle, items, columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }) {
  return (
    <div className="rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-hidden min-w-0">
      <div className="px-3 py-2 border-b border-[rgba(60,40,80,0.25)] bg-[#1a1028]/80 flex flex-wrap items-center gap-2">
        <SectionBadge tone={tone}>{title}</SectionBadge>
        {subtitle ? <span className="text-[10px] text-[#6b6b6b]">{subtitle}</span> : null}
      </div>
      <div className={cx("p-2 grid gap-2", columns)}>
        {items.map((item) => (
          <IntrinsicMetricCard key={item.name} name={item.name} value={item.value} formula={item.formula} />
        ))}
      </div>
    </div>
  );
}

function formatIntrinsicNum(val, decimals = 2) {
  if (val == null || Number.isNaN(val)) return "—";
  if (val === Infinity) return "∞";
  if (val === -Infinity) return "−∞";
  return formatMbNum(val, decimals);
}

function buildCarriedItems(em) {
  return [
    {
      name: "Median MFE",
      value: formatMbPct(em.medMFE),
      formula: "median( max_high ÷ P0 − 1 )",
    },
    {
      name: "Median MAE",
      value: formatMbPct(em.medMAE),
      formula: "median( min_low ÷ P0 − 1 )",
    },
    {
      name: "Median AIR",
      value: formatIntrinsicNum(em.medAIR),
      formula: "median( MFE ÷ |MAE|, capped at 10 )",
    },
    {
      name: "Median Return",
      value: em.medReturn != null ? formatMbPct(em.medReturn) : "—",
      formula: "median( P_exit ÷ P0 − 1 )",
    },
    {
      name: "Median Duration",
      value: em.medDurC != null ? formatIntrinsicNum(em.medDurC, 1) : "—",
      formula: "median( cycle length in candles )",
    },
    {
      name: "Median Time to MFE",
      value: formatIntrinsicNum(em.medTtMfe, 1),
      formula: "median( candles to the max high )",
    },
    {
      name: "Median Time to MAE",
      value: formatIntrinsicNum(em.medTtMae, 1),
      formula: "median( candles to the min low )",
    },
  ];
}

function buildNoPairItems(em, epochParams = {}) {
  return [
    {
      name: "CAGR",
      value: em.cagr != null ? formatMbPct(em.cagr) : "—",
      formula: "(Total ÷ start)^(1 / years) − 1",
    },
    {
      name: "Calmar",
      value: formatIntrinsicNum(em.calmar),
      formula: "CAGR ÷ |Max Drawdown (intra-cycle)|",
    },
    {
      name: "Final Score",
      value: formatIntrinsicNum(epochParams.score ?? em.finalScore),
      formula: "analyzer quality score",
    },
    {
      name: "Stability Score",
      value: formatIntrinsicNum(epochParams.stability ?? em.stabilityScore),
      formula: "analyzer stability score",
    },
  ];
}

export const MiniBacktestComparePairs = memo(function MiniBacktestComparePairs({
  result,
  epochParams = {},
}) {
  const em = result?.epoch;
  const s = result?.summary;
  if (!em || !s) return null;

  const pfBefore = em.pfOHLC === Infinity ? 9.99 : em.pfOHLC ?? 0;
  const pfAfter = (s.pfNet ?? s.profitFactor) === Infinity ? 9.99 : s.pfNet ?? s.profitFactor ?? 0;
  const epochRoi = em.roiOHLC;
  const replayRoi = s.roiTotal ?? s.roi ?? 0;
  const initialBalance = s.initialBalance ?? 0;
  const epochPnl = epochRoi != null ? initialBalance * (epochRoi / 100) : null;
  const replayPnl = s.pnlNet ?? s.totalPnL ?? 0;
  const epochMaxDd = em.maxDD;
  const replayMaxDd = s.maxDDTradIntra ?? s.maxDrawdown ?? s.maxDD ?? 0;
  const pcBefore = em.profitCapture;
  const pcAfter = s.profitCaptureExec;

  const compared = [
    {
      key: "hit",
      name: "Hit Rate / Win Rate",
      before: `${em.hitRate.toFixed(1)}%`,
      beforeFormula: "count(P_exit > P0) / all cycles",
      after: `${s.winRate.toFixed(1)}%`,
      afterFormula: "count(net > 0) / all cycles",
      delta: buildDelta(em.hitRate, s.winRate, { pp: true }),
    },
    {
      key: "pf",
      name: "Profit Factor",
      before: formatMbNum(em.pfOHLC),
      beforeFormula: "Σ winning returns / Σ losing returns",
      after: formatMbNum(s.pfNet ?? s.profitFactor),
      afterFormula: "Σ winning net / Σ losing net",
      delta: buildDelta(pfBefore, pfAfter),
    },
    {
      key: "pc",
      name: "Profit Capture",
      before: pcBefore == null ? "—" : formatMbNum(pcBefore),
      beforeFormula: "median(return / MFE)",
      after: pcAfter == null ? "—" : formatMbNum(pcAfter),
      afterFormula: "median(executed return / MFE)",
      delta: pcBefore != null && pcAfter != null ? buildDelta(pcBefore, pcAfter) : null,
    },
    {
      key: "roi",
      name: "ROI",
      before: epochRoi != null ? formatMbPct(epochRoi) : "—",
      beforeFormula: "∏(1 + return) − 1",
      after: formatMbPct(replayRoi),
      afterFormula: "equity / startBal − 1",
      delta: epochRoi != null ? buildDelta(epochRoi, replayRoi, { pp: true }) : null,
    },
    {
      key: "pnl",
      name: "PnL",
      before: epochPnl != null ? formatMbMoney(epochPnl) : "—",
      beforeFormula: "initialBalance × ROI",
      after: formatMbMoney(replayPnl),
      afterFormula: "Σ net",
      delta: epochPnl != null ? buildDelta(epochPnl, replayPnl, { money: true }) : null,
    },
    {
      key: "maxdd",
      name: "Max Drawdown",
      before: epochMaxDd != null ? `${epochMaxDd.toFixed(2)}%` : "—",
      beforeFormula: "peak-to-trough on epoch equity",
      after: `${Number(replayMaxDd).toFixed(2)}%`,
      afterFormula: "peak-to-trough on replay equity",
      delta: epochMaxDd != null ? buildDelta(epochMaxDd, replayMaxDd, { pp: true, invertTone: true }) : null,
    },
  ];

  const carriedItems = buildCarriedItems(em);
  const noPairItems = buildNoPairItems(em, epochParams);

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-hidden border-t-2 border-t-violet-500/40">
        <div className="px-3 py-2 border-b border-[rgba(60,40,80,0.25)] bg-[#1a1028]/80 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold text-[#e8e0f0]">Epoch comparison</h3>
            <p className="text-[9px] text-[#8c8c8c] mt-0.5">Theoretical epoch vs realized replay</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SectionBadge tone="before">Before</SectionBadge>
            <span className="text-[#6b6b6b] text-[10px]">→</span>
            <SectionBadge tone="after">After</SectionBadge>
          </div>
        </div>

        <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {compared.map((row) => (
            <CompareMetricCard key={row.key} {...row} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <IntrinsicSection
          tone="carried"
          title="Carried"
          subtitle="unchanged"
          items={carriedItems}
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
        />
        <IntrinsicSection
          tone="nopair"
          title="No-pair"
          items={noPairItems}
          columns="grid-cols-2 sm:grid-cols-4"
        />
      </div>
    </div>
  );
});
