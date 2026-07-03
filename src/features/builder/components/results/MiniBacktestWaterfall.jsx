import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { formatMbMoney, formatMbPct } from "../../utils/miniBacktestDisplay";

function WfRow({ label, value, className, total }) {
  return (
    <div
      className={cx(
        "flex justify-between items-baseline gap-3 py-1.5 text-[12px]",
        total ? "border-t border-[rgba(60,40,80,0.45)] mt-1 pt-2" : "border-b border-dashed border-[rgba(60,40,80,0.2)]",
      )}
    >
      <span className={cx(total ? "text-[#f5f5f5] font-semibold" : "text-[#8c8c8c]")}>{label}</span>
      <span className={cx("font-mono font-semibold shrink-0", className)}>{value}</span>
    </div>
  );
}

function WaterfallCard({ title, badge, badgeClass, children, accent }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-hidden",
        accent === "blue" && "border-t-2 border-t-blue-500/50",
        accent === "teal" && "border-t-2 border-t-teal-500/50",
      )}
    >
      <div className="px-3.5 py-2.5 border-b border-[rgba(60,40,80,0.25)] bg-[#1a1028]/80 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-[#e8e0f0]">{title}</h3>
        <span className={cx("rounded-md px-1.5 py-px text-[8px] font-bold uppercase tracking-wider border", badgeClass)}>
          {badge}
        </span>
      </div>
      <div className="px-3.5 py-2">{children}</div>
    </div>
  );
}

export const MiniBacktestWaterfall = memo(function MiniBacktestWaterfall({ result, params }) {
  const r = result?.summary;
  if (!r) return null;

  const startBal = params?.initialBalance ?? r.initialBalance ?? 0;
  const pnlGross = r.pnlGross ?? 0;
  const tradeFeesT = r.tradeFeesT ?? r.totalFees ?? 0;
  const fundingT = r.fundingT ?? 0;
  const pnlNet = r.pnlNet ?? r.totalPnL ?? 0;
  const equity = r.equity ?? r.finalBalance ?? 0;
  const reserve = r.reserve ?? 0;
  const tradable = r.tradable ?? equity - reserve;
  const roiTotal = r.roiTotal ?? r.roi ?? 0;
  const roiReserve = r.roiReserve ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <WaterfallCard
        title="P&L waterfall"
        badge="money flow"
        badgeClass="bg-blue-500/10 text-blue-300 border-blue-500/30"
        accent="blue"
      >
        <WfRow label="Starting balance" value={formatMbMoney(startBal)} />
        <WfRow
          label="PnL gross"
          value={`${pnlGross >= 0 ? "+" : ""}${formatMbMoney(pnlGross)}`}
          className={pnlGross >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <WfRow label="Trade fees" value={formatMbMoney(-tradeFeesT)} className="text-red-400" />
        <WfRow
          label="Funding"
          value={fundingT > 0 ? formatMbMoney(-fundingT) : "$0"}
          className="text-red-400"
        />
        <WfRow
          label="PnL net"
          value={`${pnlNet >= 0 ? "+" : ""}${formatMbMoney(pnlNet)}`}
          className={pnlNet >= 0 ? "text-emerald-400" : "text-red-400"}
          total
        />
      </WaterfallCard>

      <WaterfallCard
        title="Allocation"
        badge="end state"
        badgeClass="bg-teal-500/10 text-teal-300 border-teal-500/30"
        accent="teal"
      >
        <WfRow label="Total balance" value={formatMbMoney(equity)} />
        <WfRow label="Reserve (locked)" value={formatMbMoney(reserve)} className="text-teal-400" />
        <WfRow label="Tradable" value={formatMbMoney(tradable)} />
        <WfRow
          label="ROI total"
          value={formatMbPct(roiTotal)}
          className={roiTotal >= 0 ? "text-emerald-400" : "text-red-400"}
          total
        />
        <WfRow label="ROI on reserve" value={`+${roiReserve.toFixed(2)}%`} className="text-teal-400" />
      </WaterfallCard>
    </div>
  );
});
