import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { formatMbMoney, formatMbNum, formatMbPct } from "../../utils/miniBacktestDisplay";

const CARD_CLASS =
  "rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-2.5 py-2 min-w-0";

function deltaValue(b, a, unit = "") {
  const diff = a - b;
  if (Number.isNaN(diff)) return null;
  const positive = diff >= 0;
  return {
    text: `${positive ? "+" : "−"}${Math.abs(diff).toFixed(unit === "%" || unit === "pp" ? 1 : 2)}${unit}`,
    positive,
  };
}

function DeltaPill({ delta, className }) {
  if (!delta || delta === "—") return null;
  const text = typeof delta === "object" && "text" in delta ? delta.text : String(delta);
  const positive =
    typeof delta === "object" && "positive" in delta
      ? delta.positive
      : text.startsWith("+") || text === "0";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
        positive
          ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/30"
          : "bg-red-500/12 text-red-300 border-red-500/30",
        className,
      )}
    >
      {text}
    </span>
  );
}

function SectionBadge({ tone, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border",
        tone === "before" && "bg-blue-500/10 text-blue-300 border-blue-500/30",
        tone === "after" && "bg-violet-500/10 text-violet-300 border-violet-500/30",
        tone === "path" && "bg-[#2a2a2a] text-[#8c8c8c] border-[rgba(60,40,80,0.45)]",
      )}
    >
      {children}
    </span>
  );
}

function CompareMetricCard({
  name,
  src,
  before,
  after,
  delta,
  beforeLabel = "Epoch",
  afterLabel = "Replay",
  replayOnly = false,
}) {
  const showReplayOnly = replayOnly || before === "—";

  return (
    <div className={cx(CARD_CLASS, "flex flex-col gap-1.5 border-l-2 border-l-violet-500/25")}>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-[#e8e0f0] leading-snug truncate" title={name}>
          {name}
        </div>
        {src ? <div className="text-[8px] text-[#6b6b6b] mt-0.5 font-mono truncate">{src}</div> : null}
      </div>

      {showReplayOnly ? (
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[9px] text-violet-300/80 shrink-0">{afterLabel}</span>
          <span className="text-[13px] font-bold font-mono text-[#faf7fd] truncate">{after}</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
          <span className="text-[9px] text-blue-300/80 shrink-0">{beforeLabel}</span>
          <span className="text-[13px] font-bold font-mono text-[#faf7fd]">{before}</span>
          <span className="text-[#6b6b6b] text-[11px] shrink-0">→</span>
          <span className="text-[9px] text-violet-300/80 shrink-0">{afterLabel}</span>
          <span className="text-[13px] font-bold font-mono text-[#faf7fd]">{after}</span>
        </div>
      )}

      <DeltaPill delta={delta} className="self-start mt-0.5" />
    </div>
  );
}

function IntrinsicMetricCard({ name, value }) {
  return (
    <div className={cx(CARD_CLASS, "border-l-2 border-l-[rgba(60,40,80,0.45)]")}>
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c] truncate">{name}</div>
      <div className="mt-1 text-[13px] font-bold font-mono text-[#d9d9d9]">{value}</div>
    </div>
  );
}

function IntrinsicGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
      {items.map((item) => (
        <IntrinsicMetricCard key={item.name} name={item.name} value={item.value} />
      ))}
    </div>
  );
}

function formatIntrinsicNum(val, decimals = 2) {
  if (val == null || Number.isNaN(val)) return "—";
  if (val === Infinity) return "∞";
  if (val === -Infinity) return "−∞";
  return formatMbNum(val, decimals);
}

function buildIntrinsicItems(em, epochParams = {}) {
  return [
    { name: "Median MFE", value: formatMbPct(em.medMFE) },
    { name: "Median MAE", value: formatMbPct(em.medMAE) },
    { name: "Median AIR", value: formatIntrinsicNum(em.medAIR) },
    { name: "Median Return", value: em.medReturn != null ? formatMbPct(em.medReturn) : "—" },
    { name: "Median Duration", value: em.medDurC != null ? formatIntrinsicNum(em.medDurC, 1) : "—" },
    { name: "Median Time to MFE", value: formatIntrinsicNum(em.medTtMfe, 1) },
    { name: "Median Time to MAE", value: formatIntrinsicNum(em.medTtMae, 1) },
    { name: "CAGR", value: em.cagr != null ? formatMbPct(em.cagr) : "—" },
    { name: "Calmar", value: formatIntrinsicNum(em.calmar) },
    { name: "Final Score", value: formatIntrinsicNum(epochParams.score ?? em.finalScore) },
    { name: "Stability Score", value: formatIntrinsicNum(epochParams.stability ?? em.stabilityScore) },
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
      name: "Hit Rate ↔ Win Rate",
      src: "§2.4",
      beforeLabel: "Hit Rate",
      afterLabel: "Win Rate",
      before: `${em.hitRate.toFixed(1)}%`,
      after: `${s.winRate.toFixed(1)}%`,
      delta: deltaValue(em.hitRate, s.winRate, "pp"),
    },
    {
      key: "pf",
      name: "Profit Factor ↔ PF net",
      src: "§3",
      beforeLabel: "Profit Factor",
      afterLabel: "PF net",
      before: formatMbNum(em.pfOHLC),
      after: formatMbNum(s.pfNet ?? s.profitFactor),
      delta: deltaValue(pfBefore, pfAfter),
    },
    {
      key: "pc",
      name: "Profit Capture ↔ executed",
      src: "§4",
      beforeLabel: "Profit Capture",
      afterLabel: "executed",
      before: pcBefore == null ? "—" : formatMbNum(pcBefore),
      after: pcAfter == null ? "—" : formatMbNum(pcAfter),
      delta: pcBefore != null && pcAfter != null ? deltaValue(pcBefore, pcAfter) : null,
    },
    {
      key: "roi",
      name: "ROI ↔ ROI Total",
      src: "§1",
      beforeLabel: "ROI",
      afterLabel: "ROI Total",
      before: epochRoi != null ? formatMbPct(epochRoi) : "—",
      after: formatMbPct(replayRoi),
      delta: epochRoi != null ? deltaValue(epochRoi, replayRoi, "pp") : null,
    },
    {
      key: "pnl",
      name: "PnL ↔ Net PnL",
      src: "§1",
      beforeLabel: "PnL",
      afterLabel: "Net PnL",
      before: epochPnl != null ? formatMbMoney(epochPnl) : "—",
      after: formatMbMoney(replayPnl),
      delta: epochPnl != null ? deltaValue(epochPnl, replayPnl) : null,
    },
    {
      key: "maxdd",
      name: "Max Drawdown",
      src: "§5",
      beforeLabel: "Epoch",
      afterLabel: "Replay",
      before: epochMaxDd != null ? `${epochMaxDd.toFixed(2)}%` : "—",
      after: `${Number(replayMaxDd).toFixed(2)}%`,
      delta: epochMaxDd != null ? deltaValue(epochMaxDd, replayMaxDd, "pp") : null,
    },
  ];

  const intrinsicItems = buildIntrinsicItems(em, epochParams);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[12px] font-semibold text-[#f5f5f5]">Epoch comparison</h3>
            <div className="flex items-center gap-1.5 text-[9px]">
              <SectionBadge tone="before">Epoch</SectionBadge>
              <span className="text-[#6b6b6b]">→</span>
              <SectionBadge tone="after">Replay</SectionBadge>
            </div>
          </div>
          <p className="hidden sm:block text-[10px] text-[#8c8c8c] mt-0.5">
            Theoretical epoch vs realized replay
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {compared.map((row) => (
          <CompareMetricCard key={row.key} {...row} />
        ))}
      </div>

      <div className="pt-0.5">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <SectionBadge tone="path">Intrinsic</SectionBadge>
          <span className="text-[10px] text-[#6b6b6b]">Path metrics — unchanged by money layer</span>
        </div>
        <IntrinsicGrid items={intrinsicItems} />
      </div>
    </div>
  );
});
