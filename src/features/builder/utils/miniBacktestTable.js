import { getStageLabel } from "./stageSelect";
import {
  formatMbMoney,
  formatMbPct,
  formatMiniBacktestExchange,
  formatMiniBacktestStageVersion,
  formatMiniBacktestTimeRange,
  formatMiniBacktestTradingMode,
  resolveMiniBacktestRunStatus,
  resolveMiniBacktestTimeframe,
} from "./miniBacktestDisplay";

function resolveEpochNumber(entry) {
  if (entry?.epochNumber != null) return entry.epochNumber;
  const label = entry?.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

export function formatMiniBacktestDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatMiniBacktestSizing(params = {}) {
  if (params.stakeMode === "relative") {
    return `Relative ${params.relativeStakeAmount ?? "—"}%`;
  }
  return `Fixed ${formatMbMoney(params.fixedStakeAmount ?? 0)}`;
}

export function formatMiniBacktestFee(params = {}) {
  if (params.orderType === "maker") {
    return `Maker ${params.feeMaker ?? "—"}%`;
  }
  return `Taker ${params.feeTaker ?? "—"}%`;
}

export function formatMiniBacktestStageVersionLabel(entry) {
  const stage =
    entry?.stage ||
    (entry?.stageId != null ? getStageLabel(entry.stageId) : "—");
  const version = formatMiniBacktestStageVersion(entry);
  return version ? `${stage} · ${version}` : stage;
}

/** Flat row for global Mini Backtest table. */
export function buildMiniBacktestTableRow(entry) {
  const params = entry?.params ?? {};
  const summary = entry?.result?.summary;
  const execCount =
    summary?.execCount ??
    entry?.result?.rows?.filter?.((r) => ["win", "loss", "liq"].includes(r.status))?.length ??
    null;
  const totalCycles = summary?.totalCycles ?? params.cycleCount ?? entry?.result?.rows?.length ?? null;

  return {
    id: entry.id,
    date: formatMiniBacktestDate(entry.createdAt),
    strategyId: entry.strategyId ?? null,
    strategyName: entry.strategyName ?? "—",
    stageVersion: formatMiniBacktestStageVersionLabel(entry),
    epoch: resolveEpochNumber(entry) != null ? `#${resolveEpochNumber(entry)}` : "—",
    tradingMode: formatMiniBacktestTradingMode(entry.tradingMode ?? params.marketType),
    exchange: formatMiniBacktestExchange(entry.exchange),
    pairs: entry.pairs || entry.cycleMeta?.pair || "—",
    timeframe: resolveMiniBacktestTimeframe(entry),
    timeRange: formatMiniBacktestTimeRange(entry),
    sizing: formatMiniBacktestSizing(params),
    leverage: params.marketType === "futures" ? `${params.leverage ?? "—"}×` : "—",
    reserve: params.reservedPct != null ? `${params.reservedPct}%` : "—",
    fee: formatMiniBacktestFee(params),
    roi:
      summary?.roiTotal != null || summary?.roi != null
        ? formatMbPct(summary.roiTotal ?? summary.roi)
        : "—",
    totalBalance:
      summary?.equity != null || summary?.finalBalance != null
        ? formatMbMoney(summary.equity ?? summary.finalBalance)
        : "—",
    maxDd:
      summary?.maxDDTradIntra != null || summary?.maxDD != null
        ? `${Number(summary.maxDDTradIntra ?? summary.maxDD).toFixed(2)}%`
        : "—",
    winRate: summary?.winRate != null ? `${summary.winRate.toFixed(1)}%` : "—",
    executed: execCount != null ? String(execCount) : "—",
    totalCycles: totalCycles != null ? String(totalCycles) : "—",
    status: resolveMiniBacktestRunStatus(entry),
    owner: entry.owner || "—",
    entry,
  };
}
