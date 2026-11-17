import React from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { amount, formatTradeQuantity, hasNumber, money, percent, pnlTone } from "./botsDisplay";
import { duration, utcDate } from "./botsAnalytics";

function FieldTable({ title, rows, className = "" }) {
  const visible = rows.filter((row) => row != null);
  if (!visible.length) return null;
  return (
    <section
      className={`min-w-0 space-y-2 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 ${className}`}
    >
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">{title}</h4>
      <Table className="text-[11px]">
        <TableBody>
          {visible.map(([label, value]) => (
            <TableRow key={label} className="border-[rgba(60,40,80,0.35)] hover:bg-transparent">
              <TableCell className="w-[46%] whitespace-normal py-1 pl-0 pr-2 text-[#b8aecc]">{label}</TableCell>
              <TableCell className="break-words whitespace-normal py-1 pl-2 pr-0 text-right tabular-nums">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

export function BotTradeFields({ trade, strategy, compact = false }) {
  if (!trade) return null;
  const closed = Boolean(trade.closedAt);
  const futures = strategy?.params?.mode === "futures";

  const positionRows = [
    ["Trade ID", trade.id],
    ["Pair / direction", `${trade.pair} · ${trade.direction || "—"}`],
    ["Status", closed ? "Closed" : "Open"],
    ["Quantity", formatTradeQuantity(trade, strategy?.params?.mode)],
    [futures ? "Stake / margin" : "Stake", amount(trade.stake)],
    ["Notional amount", amount(trade.notionalAmount)],
    futures
      ? ["Leverage", hasNumber(trade.leverage ?? strategy?.params?.leverage) ? `${trade.leverage ?? strategy.params.leverage}×` : "No data"]
      : null,
  ];

  const pricesRows = [
    ["Entry price", money(trade.entryPrice)],
    [closed ? "Exit price" : "Current price", money(closed ? trade.exitPrice : trade.currentPrice)],
    ["Opened · UTC", utcDate(trade.openedAt)],
    ["Closed · UTC", closed ? utcDate(trade.closedAt) : "Still open"],
    ["Duration", closed ? duration(trade.openedAt, trade.closedAt) : "In progress"],
    closed ? ["Duration (candles)", trade.durationCandles ?? "No data"] : null,
    !closed ? ["Price updated · UTC", utcDate(trade.priceUpdatedAt)] : null,
  ];

  const signalRows = [
    ["Signal entry price", money(trade.entrySignalPrice)],
    ["Signal entry time · UTC", utcDate(trade.entrySignalAt)],
    ["Signal → entry delay", hasNumber(trade.entryDelaySec) ? `${trade.entryDelaySec} s` : "No data"],
    ["Signal → entry price difference", percent(trade.entryPriceDifferencePct, true)],
    ...(closed
      ? [
          ["Signal exit price", money(trade.exitSignalPrice)],
          ["Signal exit time · UTC", utcDate(trade.exitSignalAt)],
          ["Signal → exit delay", hasNumber(trade.exitDelaySec) ? `${trade.exitDelaySec} s` : "No data"],
          ["Signal → exit price difference", percent(trade.exitPriceDifferencePct, true)],
        ]
      : []),
  ];

  const riskRows = [
    [closed ? "Stop loss at close" : "Stop loss", money(trade.stopLoss)],
    !closed ? ["Stop on exchange", trade.stopOnExchange == null ? "No data" : trade.stopOnExchange ? "Placed" : "Not placed"] : null,
    !closed ? ["Distance to stop", percent(trade.stopDistancePct)] : null,
    futures ? [closed ? "Liquidation price at close" : "Liquidation price", money(trade.liquidationPrice)] : null,
    futures && !closed ? ["Distance to liquidation", percent(trade.liquidationDistancePct)] : null,
  ];

  const costsRows = [
    ["Entry fee", amount(trade.entryFee)],
    closed ? ["Exit fee", amount(trade.exitFee)] : null,
    ["Funding", futures ? amount(closed ? trade.funding : trade.fundingAccrued, true) : "Not applicable"],
    closed ? ["Profit reserve", hasNumber(trade.reservedAmount) ? amount(trade.reservedAmount) : "No data"] : null,
    closed ? ["Exit reason", trade.exitReason || "No data"] : null,
  ];

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">{closed ? "Realized P&L" : "Unrealized P&L"}</div>
          <div className={`mt-0.5 text-lg font-semibold ${pnlTone(closed ? trade.pnl : trade.unrealizedPnl)}`}>
            {amount(closed ? trade.pnl : trade.unrealizedPnl, true)}{" "}
            <span className="text-sm font-medium">({percent(trade.returnPct, true)})</span>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
        <FieldTable title="Position" rows={positionRows} />
        <FieldTable title="Prices & timing" rows={pricesRows} />
        <FieldTable title="Signals" rows={signalRows} />
        <div className="flex min-w-0 flex-col gap-3">
          <FieldTable title="Risk" rows={riskRows} />
          <FieldTable title="Costs & result" rows={costsRows} />
        </div>
      </div>
    </div>
  );
}

export function BotTradeDetails({ trade, strategy, onClose, onViewChart }) {
  if (!trade) return null;
  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Trade ${trade.id}`}
      description={`${trade.pair} · ${trade.closedAt ? "Closed trade" : "Open position"}`}
      className="max-w-[720px]"
    >
      <BotTradeFields trade={trade} strategy={strategy} />
      <div className="flex justify-end gap-2 border-t border-border pt-2">
        <AppButton onClick={onClose}>Close</AppButton>
        {onViewChart ? (
          <AppButton
            variant="default"
            onClick={() => {
              onClose();
              onViewChart(trade);
            }}
          >
            View on chart
          </AppButton>
        ) : null}
      </div>
    </AppDialog>
  );
}
