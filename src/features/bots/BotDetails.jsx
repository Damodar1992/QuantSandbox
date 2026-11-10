import React, { useEffect, useState } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { EyeIcon } from "@/components/common/Icons";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { cx, ui } from "@/constants/ui";
import { closedTrades, duration, performanceSummary } from "./botsAnalytics";
import { BotChart } from "./BotChart";
import { BotPerformance } from "./BotPerformance";
import { BotTradeDetails } from "./BotTradeDetails";
import { ManualExitControls } from "./ManualExitControls";
import { getBotRuntimeAvailability } from "./botsModel";
import { BtInfoTooltip } from "@/features/backtesting/components/BtInfoTooltip";
import {
  amount,
  date,
  formatOpenAge,
  formatTradeQuantity,
  getBotMetrics,
  hasNumber,
  money,
  percent,
  pnlTone,
  stopLossDistancePct,
} from "./botsDisplay";

export function ModeBadge({ mode }) {
  return <AppBadge variant={mode === "Live" ? "warning" : "muted"} className={mode === "Live" ? "border-amber-500/50 bg-amber-500/15 text-amber-200" : "text-violet-200"}>{mode === "Live" ? "LIVE" : "DRY-RUN"}</AppBadge>;
}

function useRuntimeAvailability(bot) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 10_000);
    return () => clearInterval(timer);
  }, []);
  return getBotRuntimeAvailability(bot, Date.now());
}

export function RuntimeBadge({ bot }) {
  const availability = useRuntimeAvailability(bot);
  const activeOffline = availability === "Offline" && ["Starting", "Running", "Paused", "Needs attention"].includes(bot.status);
  return <span title="Runtime availability · illustrative preview, not a live service check"><AppBadge status={availability} variant={availability === "Online" ? "completed" : activeOffline ? "failed" : "muted"}>{availability}</AppBadge></span>;
}

export function DataState({ bot, compact = false, showRuntimeBadge = true }) {
  const issue = bot.lastError || bot.lastWarning;
  const snapshotAt = bot.marketSnapshotAt || bot.updatedAt;
  if (compact) return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">{showRuntimeBadge ? <RuntimeBadge bot={bot} /> : null}<span>Last runtime contact: {date(bot.lastHeartbeatAt)}</span><span>Market snapshot: {date(snapshotAt)}</span><span className={bot.dataStatus === "stale" ? "text-amber-300" : ""}>{bot.dataStatus === "stale" ? "Data is stale" : "Preview · no live monitoring"}</span></div>;
  return <div className="mt-1 text-[11px] text-muted-foreground">
    <div className="flex items-center gap-2">{showRuntimeBadge ? <RuntimeBadge bot={bot} /> : null}<span>Last runtime contact: {date(bot.lastHeartbeatAt)}</span></div>
    <div>Market snapshot: {date(snapshotAt)}</div>
    <div className={bot.dataStatus === "stale" ? "text-amber-300" : ""}>{bot.dataStatus === "stale" ? "Data is stale" : "Preview · no live updates"}</div>
    {issue ? <div className="max-w-52 text-amber-200">{typeof issue === "string" ? issue : issue.message || issue.code}</div> : null}
  </div>;
}

export function BotAlerts({ bot }) {
  const issue = bot.lastError || bot.lastWarning;
  const availability = useRuntimeAvailability(bot);
  return <>
    {availability === "Offline" && ["Running", "Paused"].includes(bot.status) ? <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">Bot runtime is Offline while its lifecycle state is {bot.status}. Last contact: {date(bot.lastHeartbeatAt)}. Trading state and exposure shown here are last known; check the runtime before relying on automation. Availability is a preview in this mockup.</div> : null}
    {issue ? <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">
      <strong>{bot.lastError ? "Error" : "Warning"}</strong> · {typeof issue === "string" ? issue : issue.message || issue.code}
      <div>{date(typeof issue === "string" ? bot.updatedAt : issue.at || bot.updatedAt)} · Review Events for details.</div>
    </div> : null}
    {bot.status === "Paused" ? <div role="status" className="rounded-md border border-violet-500/40 bg-violet-500/10 p-3 text-[12px] text-violet-200">New entries are paused. The strategy continues to handle open trades.</div> : null}
    {bot.status === "Stopped" && bot.positions?.length ? <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">Bot automation is stopped. {bot.positions.length} open trade(s) remain and require manual attention. Exchange-side protection is shown only when recorded.</div> : null}
    {bot.dataStatus === "stale" ? <p role="status" className="text-[12px] text-amber-200">Trading values are from the last snapshot. Current results are unavailable.</p> : null}
  </>;
}

const POSITION_COLUMNS = [
  { key: "instrument", label: "Trade / Pair", align: "left" },
  { key: "quantity", label: "Quantity / Stake", align: "right" },
  { key: "price", label: "Entry / Current price", align: "right" },
  { key: "stop", label: "Stop loss", align: "right" },
  { key: "liquidation", label: "Liquidation price", align: "right" },
  { key: "pnl", label: "Unrealized P&L", align: "right" },
  { key: "opened", label: "Opened / Age", align: "left" },
  { key: "protection", label: "Exchange stop / Funding", align: "left" },
  { key: "actions", label: "Actions", align: "left" },
];

function PositionStack({ primary, secondary, align = "left", className, muteSecondary = true }) {
  return (
    <div className={cx("flex flex-col gap-0.5", align === "right" && "items-end text-right", className)}>
      <div className="leading-snug">{primary}</div>
      {secondary != null && secondary !== "" ? (
        <div className={cx("text-[11px] leading-snug", muteSecondary && "text-muted-foreground")}>
          {secondary}
        </div>
      ) : (
        <div className="text-[11px] leading-snug text-transparent select-none" aria-hidden>
          —
        </div>
      )}
    </div>
  );
}

export function BotPositions({ bot, strategy, onViewChart, onManualExit }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [manualPosition, setManualPosition] = useState(null);
  const isFutures = strategy?.params?.mode === "futures";
  const columns = POSITION_COLUMNS.filter((col) => col.key !== "liquidation" || isFutures);
  const asOf = bot.marketSnapshotAt || bot.updatedAt;

  return (
    <section className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <h3 className="px-4 py-3 text-[12px] font-medium">
        Open trades · {bot.positions?.length ?? "No data"}
      </h3>
      <div className="overflow-auto">
        <table className="w-full min-w-[1200px] border-collapse text-[12px]">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key}
                  className={cx(
                    "px-3 py-3 font-medium whitespace-nowrap align-bottom",
                    col.align === "right" ? "text-right" : "text-left",
                    index === 0 && "pl-4",
                    index === columns.length - 1 && "pr-4",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bot.positions?.map((position) => {
              const recordedLeverage = position.leverage ?? (isFutures ? strategy?.params?.leverage : 1);
              const leverage = hasNumber(recordedLeverage) ? Number(recordedLeverage) : null;
              const showLeverage = leverage != null && (isFutures || leverage > 1);
              const slDistance = stopLossDistancePct(position);
              const exitLine = hasNumber(position.takeProfit)
                ? `TP: ${money(position.takeProfit)}`
                : position.exitRule || null;
              const cell = (key, extra) =>
                cx(
                  "px-3 py-3 align-top whitespace-nowrap",
                  key === "instrument" && "pl-4",
                  key === "opened" && "pr-4",
                  extra,
                );

              return (
                <tr key={position.id} className="border-t border-border">
                  <td className={cell("instrument")}>
                    <div className="flex items-start gap-2">
                      <AppButton
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Open trade ${position.id} details`}
                        onClick={() => setSelectedTrade(position)}
                      >
                        <EyeIcon />
                      </AppButton>
                      <PositionStack
                        primary={<AppButton variant="link" className="h-auto p-0 text-violet-200" aria-label={`Details for open trade ${position.id}`} onClick={() => setSelectedTrade(position)}>{position.id}</AppButton>}
                        secondary={`${position.pair} · ${position.direction || "—"}${showLeverage ? ` · ${leverage}×` : ""}`}
                      />
                    </div>
                  </td>
                  <td className={cell("quantity", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={formatTradeQuantity(position, strategy?.params?.mode)}
                      secondary={`${isFutures ? "Margin" : "Stake"} ${amount(position.stake)}`}
                    />
                    {showLeverage ? <div className="mt-0.5 text-right text-[10px] text-muted-foreground">Exposure {hasNumber(position.stake) ? amount(Number(position.stake) * leverage) : "No data"}</div> : null}
                  </td>
                  <td className={cell("price", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={`Entry ${money(position.entryPrice)}`}
                      secondary={`Current ${money(position.currentPrice)}`}
                    />
                    <div className="mt-0.5 text-right text-[10px] text-muted-foreground">{date(position.priceUpdatedAt)}</div>
                  </td>
                  <td className={cell("stop", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={money(position.stopLoss)}
                      secondary={slDistance != null ? `${percent(slDistance)} from current` : null}
                    />
                    {exitLine ? <div className="mt-0.5 text-right text-[10px] text-muted-foreground">{exitLine}</div> : null}
                  </td>
                  {isFutures ? <td className={cell("liquidation", "text-right tabular-nums")}>{money(position.liquidationPrice)}</td> : null}
                  <td className={cell("pnl", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      muteSecondary={false}
                      className={pnlTone(position.unrealizedPnl)}
                      primary={amount(position.unrealizedPnl, true)}
                      secondary={percent(position.returnPct, true)}
                    />
                  </td>
                  <td className={cell("opened")}><PositionStack primary={date(position.openedAt)} secondary={formatOpenAge(position.openedAt, asOf)} /></td>
                  <td className={cell("protection")}><PositionStack primary={`Exchange stop: ${position.stopOnExchange == null ? "No data" : position.stopOnExchange ? "Placed" : "Not placed"}`} secondary={`Funding: ${isFutures ? amount(position.fundingAccrued, true) : "Not applicable"}`} />{isFutures ? <div className="text-[10px] text-muted-foreground">To liquidation: {percent(position.liquidationDistancePct)}</div> : null}</td>
                  <td className={cell("actions")}>
                    <div className="space-y-1">
                      <AppButton variant="outline" onClick={() => setManualPosition(position)}>Force exit</AppButton>
                      {position.manualExitPreview ? <div className="max-w-40 whitespace-normal text-[10px] text-amber-200">{position.manualExitPreview} · preview</div> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!bot.positions?.length ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                  {Array.isArray(bot.positions) ? "No open trades." : "Trade data unavailable."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AppDialog
        open={Boolean(manualPosition)}
        onOpenChange={(open) => {
          if (!open) setManualPosition(null);
        }}
        title={manualPosition ? `Manual exit · ${manualPosition.id}` : "Manual exit"}
        className="max-w-[520px]"
      >
        {manualPosition ? (
          <ManualExitControls
            key={manualPosition.id}
            hideTitle
            position={manualPosition}
            onSubmit={(request) => onManualExit?.(request)}
            onCancel={() => setManualPosition(null)}
          />
        ) : null}
      </AppDialog>

      <BotTradeDetails trade={selectedTrade} strategy={strategy} onClose={() => setSelectedTrade(null)} onViewChart={onViewChart} />
    </section>
  );
}

const TRADE_COLUMNS = [
  { key: "trade", label: "Trade / Pair", align: "left" },
  { key: "quantity", label: "Quantity / Stake", align: "right" },
  { key: "prices", label: "Entry / Exit price", align: "right" },
  { key: "signals", label: "Signal → execution", align: "right" },
  { key: "pnl", label: "Realized P&L", align: "right" },
  { key: "costs", label: "Fees / Funding", align: "right" },
  { key: "reserve", label: "Profit reserve", align: "right" },
  { key: "dates", label: "Opened / Closed", align: "left" },
  { key: "duration", label: "Duration", align: "left" },
  { key: "reason", label: "Exit reason", align: "left" },
  { key: "actions", label: "Actions", align: "left" },
];

export function BotTrades({ bot, strategy, onViewChart }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("All");
  const isFutures = strategy?.params?.mode === "futures";
  const allTrades = closedTrades(bot);
  const trades = allTrades.filter((trade) => (!search || `${trade.id} ${trade.pair}`.toLowerCase().includes(search.toLowerCase())) && (reason === "All" || trade.exitReason === reason)).sort(
    (a, b) => (Date.parse(b.closedAt) || 0) - (Date.parse(a.closedAt) || 0),
  );

  return (
    <section className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div><h3 className="text-[12px] font-medium">Closed trades</h3><p className="mt-1 text-[11px] text-muted-foreground">{trades.length} of {allTrades.length} trades · Prices, stake and P&L in USDT · UTC</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <AppInput aria-label="Search closed trades" placeholder="Search Trade ID or pair" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <AppSelect aria-label="Exit reason" className="w-40" value={reason} onValueChange={setReason} options={[{ value: "All", label: "All exit reasons" }, ...[...new Set(allTrades.map((t) => t.exitReason).filter(Boolean))].map((value) => ({ value, label: value }))]} />
          <AppButton disabled={!search && reason === "All"} onClick={() => { setSearch(""); setReason("All"); }}>Clear filters</AppButton>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1480px] border-collapse text-[12px]">
          <thead className="bg-secondary text-muted-foreground"><tr>{TRADE_COLUMNS.map((col, index) => <th key={col.key} className={cx("whitespace-nowrap px-3 py-3 align-bottom font-medium", col.align === "right" ? "text-right" : "text-left", index === 0 && "pl-4", index === TRADE_COLUMNS.length - 1 && "pr-4")}>{col.label}</th>)}</tr></thead>
          <tbody>
            {trades.map((trade) => {
              const leverage = trade.leverage ?? strategy?.params?.leverage;
              const direction = `${trade.direction || "—"}${isFutures && hasNumber(leverage) ? ` · ${leverage}×` : ""}`;
              return <tr key={trade.id} className="border-t border-border">
                <td className="whitespace-nowrap py-3 pl-4 pr-3 align-top"><PositionStack primary={<AppButton variant="link" className="h-auto p-0 text-violet-200" onClick={() => setSelectedTrade(trade)}>{trade.id}</AppButton>} secondary={`${trade.pair || "—"} · ${direction}`} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums"><PositionStack align="right" primary={formatTradeQuantity(trade, strategy?.params?.mode)} secondary={`${isFutures ? "Margin" : "Stake"} ${amount(trade.stake)}`} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums"><PositionStack align="right" primary={`Entry ${money(trade.entryPrice)}`} secondary={`Exit ${money(trade.exitPrice)}`} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums"><PositionStack align="right" primary={`Entry ${hasNumber(trade.entryDelaySec) ? `${trade.entryDelaySec}s` : "No data"} · ${percent(trade.entryPriceDifferencePct, true)}`} secondary={`Exit ${hasNumber(trade.exitDelaySec) ? `${trade.exitDelaySec}s` : "No data"} · ${percent(trade.exitPriceDifferencePct, true)}`} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums"><PositionStack align="right" className={pnlTone(trade.pnl)} muteSecondary={false} primary={amount(trade.pnl, true)} secondary={percent(trade.returnPct, true)} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums"><PositionStack align="right" primary={`In ${amount(trade.entryFee)} · Out ${amount(trade.exitFee)}`} secondary={`Funding ${isFutures ? amount(trade.funding, true) : "N/A"}`} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-right align-top tabular-nums" title="Profit withheld from future entries, not funds committed to the trade">{amount(trade.reservedAmount)}</td>
                <td className="whitespace-nowrap px-3 py-3 align-top"><PositionStack primary={date(trade.openedAt)} secondary={date(trade.closedAt)} /></td>
                <td className="whitespace-nowrap px-3 py-3 align-top"><PositionStack primary={duration(trade.openedAt, trade.closedAt)} secondary={hasNumber(trade.durationCandles) ? `${trade.durationCandles} candles` : "Candles: No data"} /></td>
                <td className="px-3 py-3 align-top">{trade.exitReason || "No data"}</td>
                <td className="whitespace-nowrap py-3 pl-3 pr-4 align-top"><div className="flex flex-col items-start gap-1"><AppButton variant="link" className="h-auto p-0 text-violet-200" onClick={() => onViewChart?.(trade)}>View on chart</AppButton><AppButton variant="link" className="h-auto p-0 text-violet-200" aria-label={`Closed trade ${trade.id} details`} onClick={() => setSelectedTrade(trade)}>Details</AppButton></div></td>
              </tr>;
            })}
            {!trades.length ? <tr><td colSpan={TRADE_COLUMNS.length} className="p-6 text-center text-muted-foreground">{allTrades.length ? "No trades match the current filters." : Array.isArray(bot.trades) ? "No closed trades yet." : "Trade data unavailable."}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Select a Trade ID or Details to review the trade, including its recorded risk levels at close.</p>
      <BotTradeDetails trade={selectedTrade} strategy={strategy} onClose={() => setSelectedTrade(null)} onViewChart={onViewChart} />
    </section>
  );
}

function MetricCard({ label, value, note, tone, help, children }) {
  return (
    <div className={cx(ui.radius, ui.panel, "p-3")}>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">{label}{help ? <BtInfoTooltip label={label} text={help} /> : null}</div>
      <div className={cx("mt-1 text-[16px] font-semibold tabular-nums", tone)}>{value}</div>
      {note ? <div className="mt-1 text-[11px] text-muted-foreground">{note}</div> : null}
      {children}
    </div>
  );
}

export function BotOverview({ bot, strategy, onViewChart, focusTrade, onManualExit }) {
  const metrics = getBotMetrics(bot);
  const stats = performanceSummary(bot);
  const reserveEnabled = bot.profitReserving === true || Number(strategy?.params?.profitReserving) > 0;
  const reserve = hasNumber(bot.profitReserve) ? Number(bot.profitReserve) : reserveEnabled ? null : 0;
  const openCount = Array.isArray(bot.positions) ? bot.positions.length : null;
  const reported = bot.reportedMetrics || {};
  return <div className="space-y-4">
    <div className="space-y-3">
      <div className={cx(ui.radius, ui.panel, "p-3")}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
          {[
            ["Initial capital", amount(bot.capital)],
            ["Total balance", amount(reported.totalBalance), "Closed-trade capital, including profit reserve."],
            ["Tradable balance", amount(reported.tradableBalance), "Capital available to the strategy before position commitments; excludes profit reserve."],
            ["Reserved balance", amount(reported.reservedBalance), "Profit withheld from new entries."],
            ["Total change", percent(reported.totalChangePct, true), "Change from starting capital; final calculation is pending."],
            ["Tradable change", percent(reported.tradableChangePct, true), "Change from starting capital; final calculation is pending."],
            ["Reserved change", percent(reported.reservedChangePct, true), "Reported change from start; may be undefined with zero starting reserve."],
            ["Available", amount(metrics.available)],
            ["Committed", amount(metrics.committed)],
            ["Profit reserve", amount(reserve), "Included in capital and withheld from new entries"],
          ].map(([label, value, hint]) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">{label}{hint ? <BtInfoTooltip label={label} text={hint} /> : null}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total P&L" value={amount(metrics.totalPnl, true)} note={`${percent(metrics.returnPct, true)} on initial capital`} tone={pnlTone(metrics.totalPnl)}>
          <div className="mt-1 flex w-fit gap-3 text-[11px]"><span><span className="text-muted-foreground">Open </span><span className={pnlTone(metrics.unrealized)}>{money(metrics.unrealized, true)}</span></span><span><span className="text-muted-foreground">Closed </span><span className={pnlTone(metrics.realized)}>{money(metrics.realized, true)}</span></span></div>
        </MetricCard>
        <MetricCard label="Trades" value={`${openCount ?? "—"} open · ${bot.closedTradeCount ?? "—"} closed`} note={`Win rate ${percent(stats.winRate)}`}>
          <div className="mt-1 text-[11px] text-muted-foreground">{stats.realized != null ? `${stats.wins} W / ${stats.losses} L` : "W/L · No data"}</div>
        </MetricCard>
        <MetricCard label="Max drawdown on equity" help="Largest decline between available equity samples. Live sampling and final formula remain open." value={stats.drawdown ? percent(stats.drawdown.maxPct) : "No data"} note={stats.drawdown ? `${amount(stats.drawdown.maxAmount)} · sampled equity` : "Equity history unavailable"} />
      </div>
      <div className={cx(ui.radius, ui.panel, "p-3")}>
        <div className="text-[11px] text-muted-foreground">Trade performance</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            ["Profit factor", stats.noLosses ? "No losses" : money(stats.profitFactor)],
            ["Calmar ratio", money(reported.calmar)],
            ["CAGR · total", percent(reported.cagrTotal, true)],
            ["CAGR · tradable", percent(reported.cagrTradable, true)],
            ["Win rate", percent(stats.winRate)],
            ["Entry / exit fees · open", amount(reported.openTradeFees)],
            ["Entry / exit fees · closed", amount(reported.closedTradeFees)],
            ["Total funding", amount(reported.totalFunding, true)],
            ["Fees + funding", amount(reported.feesAndFunding, true)],
            ["Average trade return", percent(stats.averageReturn, true), pnlTone(stats.averageReturn)],
            ["Average trade duration", stats.averageDuration],
            ["Expectancy per trade", amount(stats.expectancy, true), pnlTone(stats.expectancy)],
            ["Expectancy ratio", money(stats.expectancyRatio)],
            ["Closed-trade turnover", amount(stats.volume)],
            ["Current drawdown", stats.drawdown ? percent(stats.drawdown.currentPct) : "No data"],
            ["Breakeven trades", stats.draws ?? "No data"],
          ].map(([label, value, tone]) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">{label}<BtInfoTooltip label={label} text={label.includes("CAGR") ? "Annualized growth based on the selected balance. The production formula and short-history rule remain open." : label.includes("funding") || label.includes("fees") || label.includes("Fees") ? "Recorded trading costs. Funding is shown separately and in the combined total without double counting." : label === "Calmar ratio" ? "Annualized return relative to maximum drawdown; exact basis remains open." : label === "Profit factor" ? "Profit divided by loss across closed trades; final reserve/fee basis remains open." : label === "Win rate" ? "Share of winning closed trades; the treatment of breakeven trades remains open." : "Preview metric from available trade data."} /></dt>
              <dd className={cx("mt-0.5 truncate text-[13px] font-semibold tabular-nums", tone)}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
    <BotPositions bot={bot} strategy={strategy} onViewChart={onViewChart} onManualExit={onManualExit} />
    <BotChart bot={bot} strategy={strategy} focusTrade={focusTrade} />
    <BotPerformance bot={bot} />
  </div>;
}
