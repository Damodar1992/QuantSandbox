import { MINI_BACKTEST_RUN_STATUSES, normalizeMiniBacktestRunStatus } from "../../../constants/miniBacktest";

/** Full lineage path with version prefix (e.g. "v1.3" for entry, "v1.3.4" for exit). */
export function formatMiniBacktestStageVersion(entry) {
  if (!entry?.stageVersionLineage) return null;
  return `v${entry.stageVersionLineage}`;
}

function resolveEpochNumber(entry) {
  if (entry?.epochNumber != null) return entry.epochNumber;
  const label = entry?.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Context chips for mini backtest runs — market / dataset scope.
 * @param {object} entry
 */
export function formatMiniBacktestTradingMode(mode) {
  if (!mode) return "—";
  const m = String(mode).toLowerCase();
  if (m === "futures") return "Futures";
  if (m === "spot") return "Spot";
  return String(mode);
}

export function formatMiniBacktestExchange(exchange) {
  if (!exchange) return "—";
  const e = String(exchange).toLowerCase();
  if (e === "synthetic") return "Synthetic dataset";
  return e.charAt(0).toUpperCase() + e.slice(1);
}

export function resolveMiniBacktestTimeframe(entry) {
  return entry?.timeframe || entry?.cycleMeta?.timeframe || "—";
}

export function formatMiniBacktestTimeRange(entry) {
  if (entry?.timeRange && entry.timeRange !== entry?.timeframe) return entry.timeRange;
  if (entry?.knowRange) return entry.knowRange;
  if (entry?.timeFrameStart && entry?.timeFrameEnd) {
    return `${entry.timeFrameStart} – ${entry.timeFrameEnd}`;
  }
  return "—";
}

export function buildMiniBacktestLaunchContext({
  tradingMode,
  exchange,
  pairs,
  timeframe,
  timeFrameStart,
  timeFrameEnd,
  knowRange,
}) {
  const timeRange =
    knowRange ||
    (timeFrameStart && timeFrameEnd ? `${timeFrameStart} – ${timeFrameEnd}` : null) ||
    "—";

  return {
    tradingMode: tradingMode || "futures",
    exchange: exchange || "binance",
    pairs: pairs || "—",
    timeframe: timeframe || "—",
    timeRange,
  };
}

export function getMiniBacktestContextChips(entry) {
  const tradingMode = entry?.tradingMode ?? entry?.params?.marketType;
  const exchange = entry?.exchange;

  return [
    {
      key: "tradingMode",
      label: "Trading mode",
      value: formatMiniBacktestTradingMode(tradingMode),
    },
    {
      key: "exchange",
      label: "Exchange",
      value: formatMiniBacktestExchange(exchange),
    },
    {
      key: "pairs",
      label: "Pairs",
      value: entry?.pairs || entry?.cycleMeta?.pair || "—",
    },
    {
      key: "timeframe",
      label: "Time Frame",
      value: resolveMiniBacktestTimeframe(entry),
    },
    {
      key: "timeRange",
      label: "Time Range",
      value: formatMiniBacktestTimeRange(entry),
    },
  ];
}
export function formatMbMoney(v) {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Number(v);
  return `${n < 0 ? "-$" : "$"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatMbPct(v, signed = true) {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Number(v);
  return `${signed && n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function formatMbNum(v, d = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  if (v === Infinity) return "∞";
  if (v === -Infinity) return "−∞";
  return Number(v).toFixed(d);
}

/**
 * Growth % for balance KPIs vs run start (total/tradable vs initialBalance; reserve vs 0 → % of start).
 * @param {object} summary
 * @param {number} [fallbackStartBalance]
 */
export function getMiniBacktestBalanceGrowth(summary, fallbackStartBalance) {
  if (!summary) return { total: null, tradable: null, reserve: null };

  const startBal = summary.initialBalance ?? fallbackStartBalance ?? 0;
  if (startBal <= 0) return { total: null, tradable: null, reserve: null };

  const equity = summary.equity ?? summary.finalBalance ?? 0;
  const tradable = summary.tradable ?? equity - (summary.reserve ?? 0);
  const reserve = summary.reserve ?? 0;

  const total =
    summary.roiTotal ??
    summary.roi ??
    ((equity / startBal - 1) * 100);
  const tradableGrowth =
    summary.roiTradable ??
    ((tradable / startBal - 1) * 100);
  const reserveGrowth =
    summary.roiReserve ??
    ((reserve / startBal) * 100);

  return { total, tradable: tradableGrowth, reserve: reserveGrowth };
}

/** True when entry has full v5 result payload (epoch + rows). */
export function isFullMiniBacktestResult(entry) {
  return Boolean(entry?.result?.epoch && entry?.result?.rows?.length);
}

/** Resolve sidebar run status from explicit field or inferred from payload. */
export function resolveMiniBacktestRunStatus(entry) {
  if (entry?.runStatus) return normalizeMiniBacktestRunStatus(entry.runStatus);
  if (entry?.result?.summary) return MINI_BACKTEST_RUN_STATUSES.FINISHED;
  return MINI_BACKTEST_RUN_STATUSES.FAIL;
}

export function isMiniBacktestRunFinished(entry) {
  return resolveMiniBacktestRunStatus(entry) === MINI_BACKTEST_RUN_STATUSES.FINISHED;
}
