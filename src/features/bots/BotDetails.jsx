import React, { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { cx, ui } from "@/constants/ui";
import {
  ORDER_KIND_LABELS,
  amount,
  date,
  formatOpenAge,
  getBotMetrics,
  hasNumber,
  money,
  ordersForPosition,
  percent,
  pnlTone,
  stopLossDistancePct,
  summarizeOrderKinds,
} from "./botsDisplay";

const PANEL = cx(ui.radius, ui.panel, "p-4");

export function ModeBadge({ mode }) {
  return <AppBadge variant={mode === "Live" ? "warning" : "muted"} className={mode === "Live" ? "border-amber-500/50 bg-amber-500/15 text-amber-200" : "text-violet-200"}>{mode === "Live" ? "LIVE" : "DRY-RUN"}</AppBadge>;
}

export function DataState({ bot }) {
  const issue = bot.lastError || bot.lastWarning;
  return <div className="mt-1 text-[11px] text-muted-foreground">
    <div>Snapshot: {date(bot.updatedAt)}</div>
    <div className={bot.dataStatus === "stale" ? "text-amber-300" : ""}>{bot.dataStatus === "stale" ? "Data is stale" : "Preview · no live updates"}</div>
    {issue ? <div className="max-w-52 text-amber-200">{typeof issue === "string" ? issue : issue.message || issue.code}</div> : null}
  </div>;
}

export function BotAlerts({ bot }) {
  const issue = bot.lastError || bot.lastWarning;
  return <>
    {issue ? <div role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">
      <strong>{bot.lastError ? "Error" : "Warning"}</strong> · {typeof issue === "string" ? issue : issue.message || issue.code}
      <div>{date(typeof issue === "string" ? bot.updatedAt : issue.at || bot.updatedAt)} · Review Events for details.</div>
    </div> : null}
    {bot.status === "Stopping" ? <div role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">New entries are disabled. {bot.stopIntent === "wait" ? "The strategy is managing existing positions until exit." : "Position closing and order clearance are in progress."}</div> : null}
    {bot.dataStatus === "stale" ? <p role="status" className="text-[12px] text-amber-200">Trading values are from the last snapshot. Current results are unavailable.</p> : null}
  </>;
}

const POSITION_COLUMNS = [
  { key: "instrument", label: "Instrument / direction", align: "left" },
  { key: "opened", label: "Opened / age", align: "left" },
  { key: "quantity", label: "Quantity / entry", align: "right" },
  { key: "price", label: "Current price", align: "right" },
  { key: "stake", label: "Stake / exposure", align: "right" },
  { key: "pnl", label: "Unrealized P&L", align: "right" },
  { key: "stop", label: "Stop / exit", align: "right" },
  { key: "orders", label: "Open orders", align: "left" },
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

export function BotPositions({ bot, strategy }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const isFutures = strategy?.params?.mode === "futures";
  const asOf = bot.updatedAt;

  return (
    <section className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <h3 className="px-4 py-3 text-[12px] font-medium">
        Open positions · {bot.positions?.length ?? "No data"}
      </h3>
      <div className="overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-[12px]">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              {POSITION_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cx(
                    "px-3 py-3 font-medium whitespace-nowrap align-bottom",
                    col.align === "right" ? "text-right" : "text-left",
                    col.key === "instrument" && "pl-4",
                    col.key === "orders" && "pr-4",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bot.positions?.map((position) => {
              const leverage = hasNumber(position.leverage) ? Number(position.leverage) : 1;
              const showLeverage = isFutures || leverage > 1;
              const slDistance = stopLossDistancePct(position);
              const relatedOrders = ordersForPosition(bot.orders, position.id);
              const exitLine = hasNumber(position.takeProfit)
                ? `TP: ${money(position.takeProfit)}`
                : position.exitRule || null;
              const cell = (key, extra) =>
                cx(
                  "px-3 py-3 align-top whitespace-nowrap",
                  key === "instrument" && "pl-4",
                  key === "orders" && "pr-4",
                  extra,
                );

              return (
                <tr key={position.id} className="border-t border-border">
                  <td className={cell("instrument")}>
                    <PositionStack
                      primary={position.pair}
                      secondary={`${position.direction || "—"}${showLeverage ? ` · ${leverage}×` : ""}`}
                    />
                  </td>
                  <td className={cell("opened")}>
                    <PositionStack
                      primary={date(position.openedAt)}
                      secondary={formatOpenAge(position.openedAt, asOf)}
                    />
                  </td>
                  <td className={cell("quantity", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={hasNumber(position.quantity) ? position.quantity : "No data"}
                      secondary={
                        hasNumber(position.entryPrice) ? `Entry ${money(position.entryPrice)}` : "Entry —"
                      }
                    />
                  </td>
                  <td className={cell("price", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={hasNumber(position.currentPrice) ? money(position.currentPrice) : "No data"}
                      secondary={date(position.priceUpdatedAt)}
                    />
                  </td>
                  <td className={cell("stake", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={amount(position.stake)}
                      secondary={
                        showLeverage ? `Exposure ${amount(Number(position.stake) * leverage)}` : null
                      }
                    />
                  </td>
                  <td className={cell("pnl", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      muteSecondary={false}
                      className={pnlTone(position.unrealizedPnl)}
                      primary={amount(position.unrealizedPnl, true)}
                      secondary={percent(position.returnPct, true)}
                    />
                  </td>
                  <td className={cell("stop", "tabular-nums")}>
                    <PositionStack
                      align="right"
                      primary={
                        hasNumber(position.stopLoss)
                          ? `SL ${money(position.stopLoss)}${slDistance != null ? ` · ${percent(slDistance)}` : ""}`
                          : "SL —"
                      }
                      secondary={exitLine}
                    />
                  </td>
                  <td className={cell("orders")}>
                    {!Array.isArray(bot.orders) ? (
                      <PositionStack primary={<span className="text-muted-foreground">Unavailable</span>} secondary={null} />
                    ) : relatedOrders.length === 0 ? (
                      <PositionStack primary={<span className="text-muted-foreground">None</span>} secondary={null} />
                    ) : (
                      <AppButton
                        variant="link"
                        className="h-auto items-start p-0 text-left text-violet-200"
                        onClick={() => setOrderDetails({ position, orders: relatedOrders })}
                      >
                        <PositionStack
                          primary={`${relatedOrders.length} open`}
                          secondary={summarizeOrderKinds(relatedOrders)}
                        />
                      </AppButton>
                    )}
                  </td>
                </tr>
              );
            })}
            {!bot.positions?.length ? (
              <tr>
                <td colSpan={POSITION_COLUMNS.length} className="p-6 text-center text-muted-foreground">
                  {Array.isArray(bot.positions) ? "No open positions." : "Position data unavailable."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AppDialog
        open={Boolean(orderDetails)}
        onOpenChange={(open) => {
          if (!open) setOrderDetails(null);
        }}
        title="Open orders"
        description={
          orderDetails
            ? `${orderDetails.position.pair} · ${orderDetails.position.direction}`
            : undefined
        }
      >
        {orderDetails ? (
          <div className="space-y-3 text-[12px]">
            {orderDetails.orders.map((order) => (
              <div
                key={order.id}
                className={cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#faf7fd]">
                    {ORDER_KIND_LABELS[order.kind] || order.kind || "Order"} · {order.side || "—"}
                  </span>
                  <span className="text-muted-foreground">{order.status || "Open"}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="text-right tabular-nums">{hasNumber(order.price) ? money(order.price) : "No data"}</dd>
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="text-right tabular-nums">{hasNumber(order.quantity) ? order.quantity : "No data"}</dd>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="text-right">{date(order.createdAt)}</dd>
                  <dt className="text-muted-foreground">Order ID</dt>
                  <dd className="text-right font-mono text-[10px]">{order.id}</dd>
                </dl>
              </div>
            ))}
          </div>
        ) : null}
      </AppDialog>
    </section>
  );
}

const TRADE_COLUMNS = [
  { key: "direction", label: "Direction", align: "left" },
  { key: "pair", label: "Pair", align: "left" },
  { key: "stake", label: "Stake amount", align: "right" },
  { key: "openRate", label: "Open rate", align: "right" },
  { key: "closeRate", label: "Close rate", align: "right" },
  { key: "pnlPct", label: "P/L, %", align: "right" },
  { key: "pnlUsdt", label: "P/L, USDT", align: "right" },
  { key: "openDate", label: "Open date", align: "left" },
  { key: "closeDate", label: "Close date", align: "left" },
  { key: "exitReason", label: "Exit reason", align: "left" },
];

export function BotTrades({ bot }) {
  const trades = [...(bot.trades || [])].sort(
    (a, b) => (Date.parse(b.closedAt) || 0) - (Date.parse(a.closedAt) || 0),
  );

  return (
    <section className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <h3 className="px-4 py-3 text-[12px] font-medium">Closed trade history</h3>
      <div className="overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-[12px]">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              {TRADE_COLUMNS.map((col, index) => (
                <th
                  key={col.key}
                  className={cx(
                    "px-3 py-3 font-medium whitespace-nowrap align-bottom",
                    col.align === "right" ? "text-right" : "text-left",
                    index === 0 && "pl-4",
                    index === TRADE_COLUMNS.length - 1 && "pr-4",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const cell = (align, index, extra) =>
                cx(
                  "px-3 py-3 align-middle whitespace-nowrap",
                  align === "right" ? "text-right tabular-nums" : "text-left",
                  index === 0 && "pl-4",
                  index === TRADE_COLUMNS.length - 1 && "pr-4",
                  extra,
                );

              return (
                <tr key={trade.id} className="border-t border-border">
                  <td className={cell("left", 0)}>{trade.direction || "—"}</td>
                  <td className={cell("left", 1)}>{trade.pair || "—"}</td>
                  <td className={cell("right", 2)}>{amount(trade.stake)}</td>
                  <td className={cell("right", 3)}>
                    {hasNumber(trade.entryPrice) ? money(trade.entryPrice) : "No data"}
                  </td>
                  <td className={cell("right", 4)}>
                    {hasNumber(trade.exitPrice) ? money(trade.exitPrice) : "No data"}
                  </td>
                  <td className={cell("right", 5, pnlTone(trade.returnPct))}>
                    {percent(trade.returnPct, true)}
                  </td>
                  <td className={cell("right", 6, pnlTone(trade.pnl))}>
                    {hasNumber(trade.pnl) ? money(trade.pnl, true) : "No data"}
                  </td>
                  <td className={cell("left", 7)}>{date(trade.openedAt)}</td>
                  <td className={cell("left", 8)}>{date(trade.closedAt)}</td>
                  <td className={cell("left", 9)}>{trade.exitReason || "No data"}</td>
                </tr>
              );
            })}
            {!trades.length ? (
              <tr>
                <td colSpan={TRADE_COLUMNS.length} className="p-6 text-center text-muted-foreground">
                  {Array.isArray(bot.trades) ? "No closed trades yet." : "Trade data unavailable."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        P/L without Net label — fee treatment is not defined in this preview.
      </p>
    </section>
  );
}

const EQUITY_TZ = "Europe/Kyiv";
const EQUITY_TOOLTIP_STYLE = {
  background: "#170f29",
  border: "1px solid rgba(60,40,80,0.45)",
  borderRadius: 8,
  fontSize: 11,
  color: "#faf7fd",
};

function formatEquityAxisTick(value, spanMs) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  // Intra-day / short ranges: show time so ticks are not identical dates.
  if (spanMs < 48 * 60 * 60 * 1000) {
    return d.toLocaleString("en-GB", {
      timeZone: EQUITY_TZ,
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleDateString("en-GB", { timeZone: EQUITY_TZ, day: "2-digit", month: "short" });
}

function MetricCard({ label, value, note, tone, children }) {
  return (
    <div className={PANEL}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cx("mt-2 text-[18px] font-semibold tabular-nums", tone)}>{value}</div>
      {note ? <div className="mt-1 text-[11px] text-muted-foreground">{note}</div> : null}
      {children}
    </div>
  );
}

export function BotOverview({ bot, strategy }) {
  const metrics = getBotMetrics(bot);
  const samples = (bot.equityHistory || [])
    .filter((point) => hasNumber(point.value) && Number.isFinite(Date.parse(point.at)))
    .map((point) => ({ at: Date.parse(point.at), value: Number(point.value) }))
    .sort((a, b) => a.at - b.at);
  const equitySpanMs = samples.length > 1 ? samples[samples.length - 1].at - samples[0].at : 0;
  const profitReservingOn =
    bot.profitReserving === true || strategy?.params?.profitReserving === true;
  const openPositionCount = Array.isArray(bot.positions) ? bot.positions.length : null;

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        {bot.mode === "Dryrun"
          ? "Simulated results · virtual funds"
          : "Live mode preview · fictional bot allocation"}{" "}
        · Lifetime result: {date(bot.startedAt)} → {date(bot.stoppedAt || bot.updatedAt)}
      </p>

      <div
        className={cx(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
          profitReservingOn ? "xl:grid-cols-6" : "xl:grid-cols-5",
        )}
      >
        <MetricCard
          label="Bot equity"
          value={amount(metrics.equity)}
          note={`Initial capital: ${amount(bot.capital)}`}
        />
        <MetricCard
          label="Total P&L"
          value={amount(metrics.totalPnl, true)}
          note={`${percent(metrics.returnPct, true)} on initial capital`}
          tone={pnlTone(metrics.totalPnl)}
        >
          <div className="mt-2 space-y-0.5 border-t border-[rgba(60,40,80,0.35)] pt-2 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Realized</span>
              <span className={cx("tabular-nums", pnlTone(metrics.realized))}>
                {amount(metrics.realized, true)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Unrealized</span>
              <span className={cx("tabular-nums", pnlTone(metrics.unrealized))}>
                {amount(metrics.unrealized, true)}
              </span>
            </div>
          </div>
        </MetricCard>
        <MetricCard
          label="Positions & trades"
          value={
            openPositionCount == null && bot.closedTradeCount == null
              ? "No data"
              : `${openPositionCount ?? "—"} open · ${bot.closedTradeCount ?? "—"} closed`
          }
          note={`Win rate: ${percent(bot.winRate)}`}
        />
        <MetricCard
          label="Available for entries"
          value={amount(metrics.available)}
          note="Estimated · based on bot snapshot"
        />
        <MetricCard
          label="Committed to positions"
          value={amount(metrics.committed)}
          note="Funds locked in open positions"
        />
        {profitReservingOn ? (
          <MetricCard
            label="Profit reserve"
            value={amount(hasNumber(bot.profitReserve) ? bot.profitReserve : 0)}
            note="Reserving enabled"
          />
        ) : null}
      </div>

      <BotPositions bot={bot} strategy={strategy} />

      <section className={PANEL}>
        <h3 className="mb-4 text-[12px] font-medium">Equity history · USDT</h3>
        {samples.length > 1 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={samples} margin={{ top: 4, left: 10, right: 16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(184,174,204,.15)" vertical={false} />
                <XAxis
                  dataKey="at"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickCount={4}
                  minTickGap={28}
                  tick={{ fill: "#b8aecc", fontSize: 10 }}
                  tickFormatter={(value) => formatEquityAxisTick(value, equitySpanMs)}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  width={72}
                  tick={{ fill: "#b8aecc", fontSize: 10 }}
                  tickFormatter={(value) => money(value)}
                />
                <Tooltip
                  contentStyle={EQUITY_TOOLTIP_STYLE}
                  labelStyle={{ color: "#b8aecc", marginBottom: 4 }}
                  itemStyle={{ color: "#c4b5fd" }}
                  labelFormatter={(value) => date(Number(value))}
                  formatter={(value) => [amount(value), "Equity"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a78bfa"
                  fill="rgba(167,139,250,.14)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#a78bfa", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "#a78bfa", stroke: "#faf7fd", strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">
            Equity history unavailable · no historical samples
          </div>
        )}
      </section>
    </div>
  );
}
