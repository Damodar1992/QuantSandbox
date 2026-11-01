import { hasNumber } from "./botsDisplay";

const DAY = 86400000;
export const utcDate = (value) => Number.isFinite(new Date(value).getTime())
  ? new Date(value).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "No data";
export const shortDate = (value) => new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short" });
export const closedTrades = (bot) => (bot.trades || []).filter((trade) => Number.isFinite(Date.parse(trade.closedAt)));
export const duration = (from, to) => {
  const minutes = Math.round((Date.parse(to) - Date.parse(from)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "No data";
  return minutes >= 1440 ? `${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

function periodStart(value, period) {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  if (period === "weeks") d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  if (period === "months") d.setUTCDate(1);
  return d.getTime();
}

/** Fully closed trades only. All P&L belongs to final close, including prior partial exits. */
export function periodBreakdown(bot, period = "days") {
  const trades = closedTrades(bot);
  if (!trades.length) return [];
  const first = periodStart(Math.min(...trades.map((t) => Date.parse(t.closedAt))), period);
  const last = periodStart(Math.max(...trades.map((t) => Date.parse(t.closedAt))), period);
  const buckets = new Map();
  for (let at = first; at <= last;) {
    buckets.set(at, { at, trades: 0, pnl: 0, wins: 0, complete: true });
    const next = new Date(at);
    if (period === "months") next.setUTCMonth(next.getUTCMonth() + 1);
    else next.setUTCDate(next.getUTCDate() + (period === "weeks" ? 7 : 1));
    at = next.getTime();
  }
  trades.forEach((trade) => {
    const bucket = buckets.get(periodStart(trade.closedAt, period));
    bucket.trades += 1;
    if (hasNumber(trade.pnl)) {
      bucket.pnl += Number(trade.pnl);
      if (Number(trade.pnl) > 0) bucket.wins += 1;
    } else bucket.complete = false;
  });
  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    pnl: bucket.complete ? bucket.pnl : null,
    returnPct: bucket.complete && Number(bot.capital) > 0 ? bucket.pnl / Number(bot.capital) * 100 : null,
    label: period === "months"
      ? new Date(bucket.at).toLocaleDateString("en-GB", { timeZone: "UTC", month: "short", year: "numeric" })
      : `${period === "weeks" ? "Week of " : ""}${shortDate(bucket.at)}`,
  }));
}

export function equityDrawdown(bot) {
  const samples = [...(bot.equityHistory || [])]
    .filter((p) => hasNumber(p.value) && Number.isFinite(Date.parse(p.at)))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!samples.length) return null;
  let peak = Number(bot.capital) || Number(samples[0].value);
  let peakAt = bot.startedAt;
  let maxPct = 0;
  let maxAmount = 0;
  let from = null;
  let to = null;
  let currentPct = 0;
  samples.forEach((point) => {
    const value = Number(point.value);
    if (value >= peak) { peak = value; peakAt = point.at; }
    currentPct = peak > 0 ? (peak - value) / peak * 100 : 0;
    if (currentPct > maxPct) { maxPct = currentPct; maxAmount = peak - value; from = peakAt; to = point.at; }
  });
  return { maxPct, maxAmount, from, to, currentPct };
}

export function performanceSummary(bot) {
  const trades = closedTrades(bot);
  const known = Array.isArray(bot.trades) && trades.every((t) => hasNumber(t.pnl));
  const pnl = known ? trades.reduce((n, t) => n + Number(t.pnl), 0) : null;
  const wins = trades.filter((t) => hasNumber(t.pnl) && Number(t.pnl) > 0);
  const losses = trades.filter((t) => hasNumber(t.pnl) && Number(t.pnl) < 0);
  const profit = wins.reduce((n, t) => n + Number(t.pnl), 0);
  const loss = -losses.reduce((n, t) => n + Number(t.pnl), 0);
  const averageLoss = losses.length ? loss / losses.length : null;
  const durations = trades.map((t) => Date.parse(t.closedAt) - Date.parse(t.openedAt));
  const returnsKnown = trades.length > 0 && trades.every((t) => hasNumber(t.returnPct));
  const quantity = (trade) => hasNumber(trade.quantity) ? Number(trade.quantity)
    : Number(trade.entryPrice) > 0 && hasNumber(trade.stake) && Number(trade.leverage || 1) === 1 ? Number(trade.stake) / Number(trade.entryPrice) : null;
  const volumeKnown = trades.length > 0 && trades.every((t) => quantity(t) != null && hasNumber(t.entryPrice) && hasNumber(t.exitPrice));
  return {
    count: trades.length, wins: wins.length, losses: losses.length,
    draws: known ? trades.length - wins.length - losses.length : null,
    realized: pnl, returnPct: pnl != null && Number(bot.capital) > 0 ? pnl / Number(bot.capital) * 100 : null,
    winRate: known && trades.length > 0 ? wins.length / trades.length * 100 : null,
    profitFactor: known && loss > 0 ? profit / loss : null,
    noLosses: known && loss === 0 && profit > 0,
    expectancy: known && trades.length > 0 ? pnl / trades.length : null,
    expectancyRatio: known && averageLoss > 0 ? pnl / trades.length / averageLoss : null,
    averageReturn: returnsKnown ? trades.reduce((n, t) => n + Number(t.returnPct), 0) / trades.length : null,
    averageDuration: durations.length && durations.every((n) => Number.isFinite(n) && n >= 0)
      ? duration(new Date(0).toISOString(), new Date(durations.reduce((n, t) => n + t, 0) / durations.length).toISOString()) : "No data",
    volume: volumeKnown ? trades.reduce((n, t) => n + quantity(t) * (Number(t.entryPrice) + Number(t.exitPrice)), 0) : null,
    firstOpened: [...trades, ...(bot.positions || [])].map((t) => t.openedAt).filter((at) => Number.isFinite(Date.parse(at))).sort()[0],
    latestOpened: [...trades, ...(bot.positions || [])].map((t) => t.openedAt).filter((at) => Number.isFinite(Date.parse(at))).sort().at(-1),
    drawdown: equityDrawdown(bot),
  };
}

export function tradeExecutions(bot) {
  return [...closedTrades(bot), ...(bot.positions || [])].flatMap((trade) => [
    { id: `${trade.id}-entry`, trade, kind: "Entry", at: Date.parse(trade.openedAt), price: Number(trade.entryPrice) },
    ...(trade.closedAt ? [{ id: `${trade.id}-exit`, trade, kind: "Exit", at: Date.parse(trade.closedAt), price: Number(trade.exitPrice) }] : []),
  ]).filter((e) => Number.isFinite(e.at) && e.price > 0).sort((a, b) => a.at - b.at);
}

/** Include unique trades whose lifetime overlaps [from, to), even with both markers outside. */
export function tradesInWindow(bot, from, to) {
  const unique = new Map();
  [...closedTrades(bot), ...(bot.positions || [])].forEach((trade) => {
    const opened = Date.parse(trade.openedAt);
    const closed = trade.closedAt ? Date.parse(trade.closedAt) : Infinity;
    if (opened < to && closed >= from && !unique.has(trade.id)) unique.set(trade.id, trade);
  });
  return [...unique.values()].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
}

/** Deterministic illustrative market data; does not execute strategy code or request candles. */
export function demoCandles(bot, strategy) {
  const stepMatch = String(strategy?.params?.timeframe || "1h").match(/^(\d+)([mhd])$/);
  const step = stepMatch ? Number(stepMatch[1]) * ({ m: 60000, h: 3600000, d: DAY }[stepMatch[2]]) : 3600000;
  const executions = tradeExecutions(bot);
  const end = Math.floor(Date.parse(bot.stoppedAt || bot.updatedAt) / step) * step;
  if (!Number.isFinite(end) || !executions.length) return [];
  const start = Math.max(Math.floor((executions[0].at - step * 8) / step) * step, end - 239 * step);
  const anchors = [...executions.map((e) => ({ at: e.at, price: e.price })),
    ...(bot.positions || []).filter((p) => Number(p.currentPrice) > 0).map((p) => ({ at: Date.parse(bot.updatedAt), price: Number(p.currentPrice) }))].sort((a, b) => a.at - b.at);
  const baseAt = (at) => {
    const rightIndex = anchors.findIndex((a) => a.at > at);
    if (rightIndex === 0) return anchors[0].price;
    if (rightIndex < 0) return anchors.at(-1).price;
    const left = anchors[rightIndex - 1]; const right = anchors[rightIndex];
    return left.price + (right.price - left.price) * (at - left.at) / (right.at - left.at);
  };
  const candles = [];
  for (let at = start, i = 0; at <= end; at += step, i += 1) {
    const base = baseAt(at);
    const open = i ? candles[i - 1].close : base * 0.998;
    const close = base * (1 + (Math.sin(i * 1.83) + Math.cos(i * 0.57)) * 0.0025);
    const related = executions.filter((e) => e.at >= at && e.at < at + step);
    const low = Math.min(open, close, ...related.map((e) => e.price)) * (1 - 0.0015 - Math.abs(Math.sin(i)) * 0.001);
    const high = Math.max(open, close, ...related.map((e) => e.price)) * (1 + 0.0015 + Math.abs(Math.cos(i)) * 0.001);
    candles.push({ at, open, high, low, close, range: [low, high], volume: 12 + Math.abs(Math.sin(i * 2.3)) * 48,
      executions: related, signal: i % 17 === 6 ? "Entry" : i % 19 === 11 ? "Exit" : null });
  }
  return candles;
}

