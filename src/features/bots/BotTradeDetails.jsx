import React from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { amount, formatTradeQuantity, hasNumber, money, percent, pnlTone } from "./botsDisplay";
import { duration, utcDate } from "./botsAnalytics";

export function BotTradeFields({ trade, strategy, compact = false }) {
  if (!trade) return null;
  const closed = Boolean(trade.closedAt);
  const futures = strategy?.params?.mode === "futures";
  const rows = [
    ["Trade ID", trade.id], ["Pair / direction", `${trade.pair} · ${trade.direction || "—"}`],
    ["Status", closed ? "Closed" : "Open"], ["Quantity", formatTradeQuantity(trade, strategy?.params?.mode)],
    ...(futures ? [["Leverage", hasNumber(trade.leverage ?? strategy?.params?.leverage) ? `${trade.leverage ?? strategy.params.leverage}×` : "No data"]] : []),
    [futures ? "Stake / margin" : "Stake", amount(trade.stake)], ["Entry price", money(trade.entryPrice)],
    [closed ? "Exit price" : "Current price", money(closed ? trade.exitPrice : trade.currentPrice)],
    ["Opened · UTC", utcDate(trade.openedAt)], ["Closed · UTC", closed ? utcDate(trade.closedAt) : "Still open"],
    ["Duration", closed ? duration(trade.openedAt, trade.closedAt) : "In progress"],
    ...(!closed ? [["Price updated · UTC", utcDate(trade.priceUpdatedAt)]] : []),
    [closed ? "Stop loss at close" : "Stop loss", money(trade.stopLoss)],
    ...(futures ? [[closed ? "Liquidation price at close" : "Liquidation price", money(trade.liquidationPrice)]] : []),
    ...(closed ? [["Profit reserve", hasNumber(trade.reservedAmount) ? amount(trade.reservedAmount) : "No data"], ["Exit reason", trade.exitReason || "No data"]] : []),
  ];
  return <div className="space-y-4">
    {!compact ? <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="text-[11px] text-muted-foreground">{closed ? "Realized P&L" : "Unrealized P&L"}</div>
      <div className={`mt-1 text-xl font-semibold ${pnlTone(closed ? trade.pnl : trade.unrealizedPnl)}`}>{amount(closed ? trade.pnl : trade.unrealizedPnl, true)} <span className="text-sm">({percent(trade.returnPct, true)})</span></div>
    </div> : null}
    <dl className={`grid gap-x-6 gap-y-3 text-[12px] ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>{rows.map(([label, value]) => <div key={label} className="flex min-w-0 justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="break-words text-right tabular-nums">{value}</dd></div>)}</dl>
  </div>;
}

export function BotTradeDetails({ trade, strategy, onClose, onViewChart }) {
  if (!trade) return null;
  return <AppDialog open onOpenChange={(open) => !open && onClose()} title={`Trade ${trade.id}`} description={`${trade.pair} · ${trade.closedAt ? "Closed trade" : "Open position"}`} className="max-w-[580px]">
    <BotTradeFields trade={trade} strategy={strategy} />
    <div className="flex justify-end gap-2 border-t border-border pt-3"><AppButton onClick={onClose}>Close</AppButton>{onViewChart ? <AppButton variant="default" onClick={() => { onClose(); onViewChart(trade); }}>View on chart</AppButton> : null}</div>
  </AppDialog>;
}
