// Stage 5 · adapter over Mini Backtest results (Stage ≤ 4) — the inheritance source.
//
// Mini runs have no `Mini#N` identifier of their own: they are keyed by
// (epochId, paramsHash). The ordinal is derived here, per epoch, by creation
// time, so `Mini#1` is the oldest mini of that epoch and stays stable.

import { resolveBtFees } from "@/constants/backtesting";

const DASH = "—";

function parseRange(entry) {
  if (entry?.timeFrameStart || entry?.timeFrameEnd) {
    return { from: entry.timeFrameStart || "", to: entry.timeFrameEnd || "" };
  }
  const raw = entry?.timeRange || entry?.knowRange || "";
  // Only a *separator* dash splits the range — a bare `-` would cut ISO dates apart.
  const parts = String(raw)
    .split(/\s+[–—-]\s+|\s*→\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { from: parts[0], to: parts[1] };
  return { from: "", to: "" };
}

function firstPair(pairs) {
  if (!pairs) return "";
  return String(pairs).split(",")[0].trim();
}

/** Mini config → BacktestRun.params (fees excluded: they are always derived). */
export function miniToBacktestParams(entry) {
  const p = entry?.params || {};
  const { from, to } = parseRange(entry);
  const mode = entry?.tradingMode || p.marketType || "spot";
  const stakeMode = p.stakeMode === "relative" ? "relative" : "fixed";
  return {
    periodFrom: from,
    periodTo: to,
    pair: firstPair(entry?.pairs),
    timeframe: entry?.timeframe || "",
    exchange: entry?.exchange || "binance",
    mode,
    leverage: mode === "spot" ? 1 : Number(p.leverage) || 1,
    startingCapital: Number(p.initialBalance) || 0,
    stakeMode,
    stakeValue:
      stakeMode === "relative"
        ? Number(p.relativeStakeAmount) || 0
        : Number(p.fixedStakeAmount) || 0,
    profitReserving: Number(p.reservedPct) > 0 ? Number(p.reservedPct) : null,
  };
}

/** Core metrics of the mini, mapped onto the six Stage 5 core keys. */
export function miniCoreMetrics(entry) {
  const s = entry?.result?.summary;
  if (!s) return null;
  return {
    roi: s.roiTotal ?? s.roi ?? null,
    pnl: s.pnlNet ?? s.totalPnL ?? null,
    maxdd: s.maxDDTradIntra ?? s.maxDrawdown ?? null,
    pf: s.pfNet ?? s.profitFactor ?? null,
    winrate: s.winRate ?? null,
    trades: s.execCount ?? s.totalTrades ?? null,
  };
}

/** Fees the mini was launched with — entered by hand, hence the Δ gap. */
export function miniManualFees(entry) {
  const p = entry?.params || {};
  return {
    maker: Number(p.feeMaker) || 0,
    taker: Number(p.feeTaker) || 0,
    funding: false,
  };
}

/**
 * All finished minis of one epoch, numbered `Mini#N` and ready for the select.
 * @param {Array} miniResults every mini result of the current strategy
 * @param {string|number} epochId
 */
export function deriveMiniOptions(miniResults, epochId) {
  const list = (miniResults || [])
    .filter((entry) => entry && entry.epochId === epochId)
    .filter((entry) => entry.result && entry.result.summary)
    .slice()
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

  return list.map((entry, idx) => {
    const params = miniToBacktestParams(entry);
    const name = `Mini#${idx + 1}`;
    const period =
      params.periodFrom || params.periodTo
        ? `${params.periodFrom || "?"} → ${params.periodTo || "?"}`
        : DASH;
    const market = `${params.pair || DASH} ${params.timeframe || DASH}`;
    const venue = `${params.exchange || DASH} ${params.mode || DASH}`;
    return {
      id: entry.id,
      name,
      ordinal: idx + 1,
      epochNumber: entry.epochNumber ?? null,
      label: `${name} · Epoch #${entry.epochNumber ?? DASH} · ${period} · ${market} · ${venue}`,
      params,
      core: miniCoreMetrics(entry),
      manualFees: miniManualFees(entry),
      derivedFees: resolveBtFees(params.exchange, params.mode),
      entry,
    };
  });
}

/** Which params were changed against the mini — drives the `✎ edited` badge. */
export function diffAgainstMini(params, miniParams) {
  if (!miniParams) return [];
  const keys = [
    "periodFrom",
    "periodTo",
    "pair",
    "timeframe",
    "exchange",
    "mode",
    "leverage",
    "startingCapital",
    "stakeMode",
    "stakeValue",
    "profitReserving",
  ];
  return keys.filter((key) => {
    const a = params?.[key];
    const b = miniParams?.[key];
    if (a === null && b === null) return false;
    if (typeof a === "number" || typeof b === "number") {
      return Number(a ?? 0) !== Number(b ?? 0);
    }
    return String(a ?? "") !== String(b ?? "");
  });
}

export { DASH as MINI_DASH };
