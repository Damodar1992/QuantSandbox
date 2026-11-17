import { amount, formatTradeQuantity, hasNumber, money } from "./botsDisplay";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** UTC clock as HH:mm:ss for trace rows. */
export function formatTraceTime(iso) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function shiftIso(iso, seconds) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms + seconds * 1000).toISOString();
}

function orderRef(trade) {
  const raw = String(trade.id || "trade").replace(/\D/g, "") || "1";
  return `A${raw.padStart(2, "0").slice(-2)}`;
}

function candleHint(iso) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms - 60_000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/**
 * Build a preview execution trace for an open position or closed trade.
 * Uses `trade.traceLogs` when present; otherwise synthesizes from known fields.
 */
export function buildTradeTraceLogs(trade, strategy) {
  if (!trade) return [];
  if (Array.isArray(trade.traceLogs) && trade.traceLogs.length) return trade.traceLogs;

  const closed = Boolean(trade.closedAt);
  const qty = formatTradeQuantity(trade, strategy?.params?.mode);
  const side = (trade.direction || "").toLowerCase() === "short" ? "sell" : "buy";
  const stakeLabel = hasNumber(trade.stake) ? amount(trade.stake) : "Stake n/a";
  const signalAt = trade.entrySignalAt || shiftIso(trade.openedAt, -35);
  const orderAt = shiftIso(signalAt, 1);
  const acceptedAt = shiftIso(signalAt, 2);
  const filledAt = trade.openedAt || shiftIso(signalAt, 3);
  const candle = candleHint(signalAt);

  const rows = [
    {
      at: signalAt,
      status: "ok",
      label: "Entry signal",
      detail: candle ? `EMA condition met · candle ${candle}` : "Entry condition met",
    },
    {
      at: signalAt,
      status: "ok",
      label: "Risk checks",
      detail: `${stakeLabel} · slot available`,
    },
    {
      at: orderAt,
      status: "sent",
      label: "Entry order sent",
      detail: `Market ${side} · ${qty}`,
    },
    {
      at: acceptedAt,
      status: "ok",
      label: "Exchange accepted",
      detail: `Order #${orderRef(trade)}`,
    },
    {
      at: filledAt,
      status: "ok",
      label: "Entry filled",
      detail: `${qty} @ ${money(trade.entryPrice)}${hasNumber(trade.entryFee) ? ` · fee ${amount(trade.entryFee)}` : ""}`,
    },
  ];

  if (!closed) return rows;

  const exitSignalAt = trade.exitSignalAt || shiftIso(trade.closedAt, -20);
  const exitReason = trade.exitReason || "Exit condition met";
  rows.push(
    {
      at: exitSignalAt,
      status: "sent",
      label: "Exit signal",
      detail: exitReason === "Exit signal" ? "Exit condition met" : exitReason,
    },
    {
      at: trade.closedAt,
      status: "ok",
      label: "Exit filled",
      detail: `${qty} @ ${money(trade.exitPrice)} · net P&L ${amount(trade.pnl, true)}`,
    },
  );
  return rows;
}

export function tradeTraceHeadline(trade) {
  if (!trade) return "";
  return `${trade.pair || "—"} · ${trade.direction || "—"} · ${trade.id}`;
}
