// Stage 5 · deterministic mock result generators.
// There is no backend: every run result is derived from its own id, so a run
// always shows the same numbers across reloads and re-renders.

import { BT_CORE_METRICS, BT_SHUFFLER_DIAGNOSTIC_CODES } from "@/constants/backtesting";
import { computePessimismGrid, shufflerSections } from "./pessimism";
import { metricValidity } from "./shufflerValidity";
import { buildTemporalSummary } from "./temporalSummary";
import { buildFeesSummary, buildSettingsSummary } from "./feesSettingsSummary";
import { buildTradesSummary } from "./tradesSummary";

/* ------------------------------------------------------------------- random */

function strHash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i += 1) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(seedParts) {
  return mulberry32(strHash(seedParts.join("|")));
}

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const between = (rnd, lo, hi) => lo + rnd() * (hi - lo);

/* --------------------------------------------------------------- backtest */

/**
 * Core metrics of a Level 0 backtest run + the streak stats the pessimism grid
 * needs as its Original row.
 */
export function buildBacktestResult(run) {
  const rnd = rngFor(["backtest", run.id]);
  const trades = Math.floor(between(rnd, 90, 480));
  const winrate = round(between(rnd, 38, 63), 1);
  const roi = round(between(rnd, -12, 46), 2);
  const startingCapital = Number(run.params?.startingCapital) || 10000;
  const pnl = round((startingCapital * roi) / 100, 2);
  const maxdd = round(between(rnd, 6, 34), 2);
  const pf = round(between(rnd, 0.82, 2.4), 2);

  const losses = Math.max(1, Math.round((trades * (100 - winrate)) / 100));
  const wins = Math.max(1, trades - losses);

  // Streak bag aligned with the Pessimism Stress-Test reference screenshot:
  // Original MCL 5 / MCW 8 / ACL 2.38 / ACW 2.71, with losses capped at 8 so
  // higher levels (MCL 10+) show as unreachable → 8.
  const streaks = {
    mcl: 5,
    mcw: 8,
    acl: 2.38,
    acw: 2.71,
    wins,
    losses: 8,
  };

  return {
    core: { roi, pnl, maxdd, pf, winrate, trades },
    streaks,
    slippagePct: round(between(rnd, 0.01, 0.08), 3),
    performance: buildPerformanceSummary(run, {
      rnd,
      roi,
      pnl,
      maxdd,
      pf,
      winrate,
      trades,
      wins,
      losses,
      startingCapital,
    }),
    temporal: buildTemporalSummary(run),
    fees: buildFeesSummary(run),
    settings: buildSettingsSummary(run),
    tradesList: buildTradesSummary(run),
  };
}

/**
 * Rich Performance-summary payload for Backtesting info → Performance tab.
 * Deterministic from the same run id as core metrics.
 */
export function buildPerformanceSummary(run, ctx) {
  const {
    rnd,
    roi,
    pnl,
    maxdd,
    pf,
    winrate,
    trades,
    wins,
    losses,
    startingCapital,
  } = ctx;

  const pair = run.params?.pair || "—";
  const mode = run.params?.mode || "spot";
  const pairLabel = mode === "futures" || mode === "futures_isolated"
    ? `${pair}:USDT`
    : pair.includes(":")
      ? pair
      : `${pair}:USDT`;

  const days = Math.max(1, Math.floor(between(rnd, 180, 2800)));
  const annualPlPct = round((roi / days) * 365, 2);
  const reservedShare = round(between(rnd, 0.05, 0.28), 3);
  const totalBalance = round(startingCapital + pnl * between(rnd, 0.75, 1.05), 2);
  const reserved = round(Math.max(0, (startingCapital + Math.max(pnl, 0)) * reservedShare), 2);
  const tradable = round(totalBalance - reserved, 2);
  const netPlTotal = round(totalBalance - startingCapital, 2);

  const takerFee = round(-Math.abs(pnl) * between(rnd, 0.35, 0.55) - between(rnd, 50, 800), 2);
  const makerFee = round(between(rnd, 0, 1) > 0.7 ? between(rnd, -40, -2) : 0, 2);
  const fundingFees = mode === "spot" ? 0 : round(between(rnd, -80, 40), 2);
  const totalFees = round(makerFee + takerFee + fundingFees, 2);

  const maxDdRealPct = round(maxdd * between(rnd, 0.92, 1.08), 2);
  const avgDdAccountPct = round(maxdd * between(rnd, 0.08, 0.22), 2);
  const maxDdRealUsdt = round((startingCapital * maxDdRealPct) / 100, 2);
  const maxDdAbs = round(maxDdRealPct * between(rnd, 0.97, 1.06), 2);

  const lossRate = round(100 - winrate, 2);
  const avgDaily = round(trades / days, 2);
  const oclClosedPct = round(between(rnd, 0, 8), 1);
  const oclOtherPct = round(100 - oclClosedPct, 1);
  const oclText = `${fmtNumLocal(oclClosedPct)}% / ${fmtNumLocal(oclOtherPct)}%`;

  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtHms = (totalSec) => {
    const s = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${pad2(m)}:${pad2(sec)}`;
  };
  const fmtDaysHms = (totalSec) => {
    const s = Math.max(0, Math.floor(totalSec));
    const d = Math.floor(s / 86400);
    const rem = s % 86400;
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    const sec = rem % 60;
    return `${d} days ${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
  };

  const durAvg = Math.floor(between(rnd, 900, 3600));
  const durMin = Math.floor(between(rnd, 300, Math.min(900, durAvg)));
  const durMax = Math.floor(between(rnd, durAvg, 20000));

  const downAvg = Math.floor(between(rnd, 600, 7200));
  const downMin = Math.floor(between(rnd, 60, Math.min(600, downAvg)));
  const downMax = Math.floor(between(rnd, downAvg, 200000));

  const sizeAvg = round(between(rnd, 200, 2000), 2);
  const sizeMin = round(sizeAvg * between(rnd, 0.15, 0.4), 2);
  const sizeMax = round(sizeAvg * between(rnd, 2.5, 8), 2);

  const maxLossCount = Math.max(2, Math.round(between(rnd, 4, 18)));
  const avgLossCount = round(between(rnd, 1.2, 3.5), 2);
  const maxLossAmount = round(-Math.abs(startingCapital) * between(rnd, 0.15, 0.55), 2);
  const avgLossAmount = round(maxLossAmount * between(rnd, 0.05, 0.2), 2);
  const maxWinCount = Math.max(2, Math.round(between(rnd, 3, 14)));
  const avgWinCount = round(between(rnd, 1.2, 3.2), 2);
  const maxWinAmount = round(startingCapital * between(rnd, 0.08, 0.45), 2);
  const avgWinAmount = round(maxWinAmount * between(rnd, 0.08, 0.25), 2);

  const longCount = Math.floor(trades * between(rnd, 0.45, 0.62));
  const shortCount = trades - longCount;
  const netPlLongPct = round(roi * between(rnd, 0.4, 0.6), 2);
  const netPlShortPct = round(roi - netPlLongPct, 2);
  const netPlLongUsdt = round((startingCapital * netPlLongPct) / 100, 2);
  const netPlShortUsdt = round((startingCapital * netPlShortPct) / 100, 2);

  const minBalance = round(startingCapital * between(rnd, 0.05, 0.4), 2);
  const maxBalance = round(startingCapital * between(rnd, 0.95, 1.4), 2);
  const marketChangePct = round(between(rnd, -40, 800), 2);

  const year = 2019 + Math.floor(between(rnd, 0, 5));
  const month = 1 + Math.floor(between(rnd, 0, 11));
  const day = 1 + Math.floor(between(rnd, 0, 27));
  const endDay = Math.min(28, day + Math.floor(between(rnd, 5, 40)));
  const pad = (n) => String(n).padStart(2, "0");
  const ddStart = `${year} ${pad(month)} ${pad(day)} ${pad(Math.floor(between(rnd, 0, 23)))}:${pad(Math.floor(between(rnd, 0, 59)))}:00`;
  const ddEnd = `${year} ${pad(Math.min(12, month + 1))} ${pad(Math.min(28, endDay))} ${pad(Math.floor(between(rnd, 0, 23)))}:${pad(Math.floor(between(rnd, 0, 59)))}:00`;

  const cell = (value) => ({ pair: value, total: value });

  return {
    pairLabel,
    sections: [
      {
        key: "result",
        title: "RESULT",
        hint: "What the run produced overall, after every cost.",
        rows: [
          { key: "netPlPct", label: "Net P/L tradable, %", ...cell(roi), tone: "signed" },
          { key: "netPlUsdt", label: "Net P/L tradable, USDT", ...cell(pnl), tone: "money", unit: "USDT" },
          { key: "annualPl", label: "Annual P/L, %", ...cell(annualPlPct), tone: "signed" },
          { key: "netPlTotal", label: "Net P/L total, USDT", ...cell(netPlTotal), tone: "money", unit: "USDT" },
        ],
      },
      {
        key: "costs",
        title: "COSTS",
        hint: "What trading cost — exchange fees and funding.",
        rows: [
          { key: "maker", label: "Maker fee", ...cell(makerFee), tone: "money", unit: "USDT" },
          { key: "taker", label: "Taker fee", ...cell(takerFee), tone: "money", unit: "USDT" },
          { key: "funding", label: "Funding fees", ...cell(fundingFees), tone: "money", unit: "USDT" },
          {
            key: "totalFees",
            label: "Total fees (maker + taker + funding)",
            ...cell(totalFees),
            tone: "money",
            unit: "USDT",
          },
        ],
      },
      {
        key: "drawdown",
        title: "DRAWDOWN",
        hint: "How deep the account went under water — and how deep the open positions went (real).",
        rows: [
          {
            key: "maxDdAccount",
            label: "Max drawdown, account %",
            ...cell(maxdd),
            tone: "drawdown-pct",
          },
          {
            key: "avgDd",
            label: "Avg drawdown, %",
            ...cell(avgDdAccountPct),
            tone: "drawdown-pct",
          },
          {
            key: "maxDdRealPct",
            label: "Max drawdown, real %",
            ...cell(maxDdRealPct),
            tone: "drawdown-pct",
          },
          {
            key: "maxDdRealUsdt",
            label: "Max drawdown, real USDT",
            ...cell(maxDdRealUsdt),
            tone: "drawdown-money",
            unit: "USDT",
          },
          {
            key: "maxDdAbs",
            label: "Max drawdown, ABS",
            ...cell(maxDdAbs),
            tone: "drawdown-pct",
          },
        ],
      },
      {
        key: "trades",
        title: "TRADES",
        hint: "Sample size and how it splits by outcome.",
        rows: [
          { key: "days", label: "Backtesting days", ...cell(days), tone: "int" },
          { key: "trades", label: "Total trades", ...cell(trades), tone: "int" },
          { key: "avgDaily", label: "Avg daily trades", ...cell(avgDaily), tone: "num" },
          {
            key: "winrate",
            label: "Win rate (wins / losses)",
            pair: `${fmtNumLocal(winrate)}% / ${fmtNumLocal(lossRate)}%`,
            total: `${fmtNumLocal(winrate)}% / ${fmtNumLocal(lossRate)}%`,
            tone: "neutral-text",
          },
          {
            key: "ccl",
            label: "Trades closed by CCL",
            pair: oclText,
            total: oclText,
            tone: "neutral-text",
          },
        ],
      },
      {
        key: "duration",
        title: "TRADE DURATION",
        hint: "How long a position is held — from entry to exit.",
        rows: [
          { key: "durAvg", label: "Trade duration · Avg", ...cell(fmtHms(durAvg)), tone: "neutral-text" },
          { key: "durMin", label: "Trade duration · Min", ...cell(fmtHms(durMin)), tone: "neutral-text" },
          { key: "durMax", label: "Trade duration · Max", ...cell(fmtHms(durMax)), tone: "neutral-text" },
        ],
      },
      {
        key: "downtime",
        title: "DOWNTIME BETWEEN TRADES",
        hint: "Idle time with no position open.",
        rows: [
          {
            key: "downAvg",
            label: "Downtime · Avg",
            ...cell(fmtDaysHms(downAvg)),
            tone: "neutral-text",
          },
          {
            key: "downMin",
            label: "Downtime · Min",
            ...cell(fmtDaysHms(downMin)),
            tone: "neutral-text",
          },
          {
            key: "downMax",
            label: "Downtime · Max",
            ...cell(fmtDaysHms(downMax)),
            tone: "neutral-text",
          },
        ],
      },
      {
        key: "size",
        title: "TRADE SIZE",
        hint: "Notional value of a position at entry (stake × leverage).",
        rows: [
          {
            key: "sizeAvg",
            label: "Trade size · Avg",
            ...cell(sizeAvg),
            tone: "money-unsigned",
            unit: "USDT",
          },
          {
            key: "sizeMin",
            label: "Trade size · Min",
            ...cell(sizeMin),
            tone: "money-unsigned",
            unit: "USDT",
          },
          {
            key: "sizeMax",
            label: "Trade size · Max",
            ...cell(sizeMax),
            tone: "money-unsigned",
            unit: "USDT",
          },
        ],
      },
      {
        key: "streaks",
        title: "CONSECUTIVE STREAKS",
        hint: "What a live account would have to sit through.",
        rows: [
          { key: "maxLossN", label: "Losses, max count", ...cell(maxLossCount), tone: "int-neg" },
          { key: "avgLossN", label: "Losses, avg count", ...cell(avgLossCount), tone: "num-neg" },
          {
            key: "maxLossAmt",
            label: "Losses, max amount",
            ...cell(maxLossAmount),
            tone: "money",
            unit: "USDT",
          },
          {
            key: "avgLossAmt",
            label: "Losses, avg amount",
            ...cell(avgLossAmount),
            tone: "money",
            unit: "USDT",
          },
          { key: "maxWinN", label: "Wins, max count", ...cell(maxWinCount), tone: "int-pos" },
          { key: "avgWinN", label: "Wins, avg count", ...cell(avgWinCount), tone: "num-pos" },
          {
            key: "maxWinAmt",
            label: "Wins, max amount",
            ...cell(maxWinAmount),
            tone: "money",
            unit: "USDT",
          },
          {
            key: "avgWinAmt",
            label: "Wins, avg amount",
            ...cell(avgWinAmount),
            tone: "money",
            unit: "USDT",
          },
        ],
      },
      {
        key: "balances",
        title: "BALANCES AT THE END OF THE RUN",
        hint: "Where the capital ended up.",
        rows: [
          { key: "tradable", label: "Tradable amount", ...cell(tradable), tone: "money-unsigned", unit: "USDT" },
          { key: "reserved", label: "Reserved amount", ...cell(reserved), tone: "money-unsigned", unit: "USDT" },
          { key: "totalBal", label: "Total balance", ...cell(totalBalance), tone: "money-unsigned", unit: "USDT" },
          {
            key: "ratio",
            label: "Ratio",
            ...cell(round(reserved / Math.max(tradable, 1e-9), 3)),
            tone: "num",
          },
        ],
      },
    ],
    cards: [
      {
        key: "risk",
        title: "Risk-adjusted ratios",
        rows: [
          { key: "cagr", label: "CAGR total", value: annualPlPct, tone: "signed", suffix: "%" },
          { key: "sortino", label: "Sortino", value: round(between(rnd, -25, 4), 2), tone: "signed" },
          { key: "sharpe", label: "Sharpe", value: round(between(rnd, -25, 3), 2), tone: "signed" },
          { key: "calmar", label: "Calmar", value: round(between(rnd, -2, 1.5), 2), tone: "signed" },
          {
            key: "expectancy",
            label: "Expectancy (ratio)",
            value: round(between(rnd, 0.2, 1.4), 2),
            tone: "num",
          },
          { key: "profitFactor", label: "Profit factor", value: pf, tone: "pf" },
        ],
      },
      {
        key: "outcome",
        title: "Outcome split",
        rows: [
          {
            key: "outcomeCounts",
            label: "Wins / draws / losses",
            text: `${wins.toLocaleString("en-US")} / 0 / ${losses.toLocaleString("en-US")}`,
            tone: "neutral-text",
          },
          {
            key: "outcomeDays",
            label: "Winning / draw / losing days",
            text: `${Math.floor(between(rnd, 10, 80))} / ${Math.floor(between(rnd, 0, 5))} / ${Math.floor(between(rnd, 40, 400))}`,
            tone: "neutral-text",
          },
          {
            key: "avgDurWinners",
            label: "Avg duration, winners",
            text: `${Math.floor(durAvg / 60) + 20}m`,
            tone: "neutral-text",
          },
          {
            key: "avgDurLosers",
            label: "Avg duration, losers",
            text: `${Math.max(5, Math.floor(durAvg / 60) - 10)}m`,
            tone: "neutral-text",
          },
        ],
      },
      {
        key: "extremes",
        title: "Best and worst",
        rows: [
          {
            key: "bestDay",
            label: "Best day",
            text: `${signedPct(round(between(rnd, 1, 25), 2))} / ${signedMoney(round(between(rnd, 50, 900), 2))} USDT`,
            tone: "pos-text",
          },
          {
            key: "worstDay",
            label: "Worst day",
            text: `${signedPct(round(-between(rnd, 5, 90), 2))} / ${signedMoney(round(-between(rnd, 200, 5000), 2))} USDT`,
            tone: "neg-text",
          },
          {
            key: "bestTrade",
            label: "Best single trade",
            text: `${signedPct(round(between(rnd, 2, 40), 2))} / ${signedMoney(round(between(rnd, 80, 1200), 2))} USDT`,
            tone: "pos-text",
          },
          {
            key: "worstTrade",
            label: "Worst single trade",
            text: `${signedPct(round(-between(rnd, 5, 50), 2))} / ${signedMoney(round(-between(rnd, 100, 2000), 2))} USDT`,
            tone: "neg-text",
          },
        ],
      },
      {
        key: "direction",
        title: "Direction split",
        rows: [
          {
            key: "longShortCounts",
            label: "Long / short trades",
            text: `${longCount.toLocaleString("en-US")} / ${shortCount.toLocaleString("en-US")}`,
            tone: "neutral-text",
          },
          {
            key: "netPlLong",
            label: "Net P/L long",
            text: `${signedPct(netPlLongPct)} / ${signedMoney(netPlLongUsdt)} USDT`,
            tone: netPlLongPct >= 0 ? "pos-text" : "neg-text",
          },
          {
            key: "netPlShort",
            label: "Net P/L short",
            text: `${signedPct(netPlShortPct)} / ${signedMoney(netPlShortUsdt)} USDT`,
            tone: netPlShortPct >= 0 ? "pos-text" : "neg-text",
          },
        ],
      },
      {
        key: "balanceRange",
        title: "Balance range and market",
        rows: [
          {
            key: "minBalance",
            label: "Min balance",
            text: `${fmtNumLocal(minBalance)} USDT`,
            tone: "neutral-text",
          },
          {
            key: "maxBalance",
            label: "Max balance",
            text: `${fmtNumLocal(maxBalance)} USDT`,
            tone: "neutral-text",
          },
          {
            key: "marketChange",
            label: "Market change",
            text: signedPct(marketChangePct),
            tone: marketChangePct >= 0 ? "pos-text" : "neg-text",
          },
        ],
      },
      {
        key: "ddWindow",
        title: "Drawdown window",
        rows: [
          {
            key: "ddHighLow",
            label: "Drawdown high | low",
            text: `${fmtNumLocal(maxBalance)} / ${fmtNumLocal(minBalance)}`,
            tone: "drawdown-text",
          },
          { key: "ddStart", label: "Drawdown start", text: ddStart, tone: "neutral-text" },
          { key: "ddEnd", label: "Drawdown end", text: ddEnd, tone: "neutral-text" },
        ],
      },
    ],
  };
}

function fmtNumLocal(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function signedPct(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function signedMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* --------------------------------------------------------------- shuffler */

/**
 * @param {object} run    ShufflerRun (config + inherited)
 * @param {object} parent parent BacktestRun (needs result.core / result.streaks)
 */
export function buildShufflerResult(run, parent) {
  const rnd = rngFor(["shuffler", run.id]);
  const original = parent?.result?.core || {};
  const dynamic = run.config?.simulationMode === "dynamic";
  const ctx = { simulationMode: run.config?.simulationMode, hasStopOut: false };

  const core = BT_CORE_METRICS.map((metric) => {
    const originalValue = original[metric.key] ?? null;
    const { valid, reason } = metricValidity(metric.key, ctx);
    if (!valid) {
      return {
        metric: metric.key,
        original: originalValue,
        mean: originalValue,
        median: originalValue,
        percentile: "N/A",
        valid: false,
        reason,
      };
    }
    const spread = metric.key === "maxdd" ? between(rnd, 1.15, 1.75) : between(rnd, 0.82, 1.12);
    const mean = originalValue == null ? null : round(originalValue * spread, metric.decimals);
    const median =
      mean == null ? null : round(mean * between(rnd, 0.96, 1.04), metric.decimals);
    const min = mean == null ? null : round(mean * between(rnd, 0.55, 0.85), metric.decimals);
    const max = mean == null ? null : round(mean * between(rnd, 1.15, 1.55), metric.decimals);
    return {
      metric: metric.key,
      original: originalValue,
      mean,
      median,
      min,
      max,
      percentile: round(between(rnd, dynamic ? 8 : 20, dynamic ? 92 : 80), 1),
      valid: true,
      reason: null,
      star: metric.kind === "drawdown" ? "max" : "none",
    };
  });

  const grid = computePessimismGrid(
    run.config?.pessimismLevels,
    run.config?.shufflesN,
    parent?.result?.streaks || {},
  );

  const sections = shufflerSections(run.config).map((section) => {
    const sRnd = rngFor(["shuffler-section", run.id, section.key]);
    const n =
      section.key === "total"
        ? Number(run.config?.shufflesN) || 0
        : section.key === "random"
          ? grid.randomRunsN
          : (grid.rows.find((r) => r.level === section.key)?.runsN ?? 0);
    const metrics = BT_CORE_METRICS.map((metric) => {
      const originalValue = original[metric.key] ?? null;
      const { valid, reason } = metricValidity(metric.key, ctx);
      if (!valid) {
        return {
          metric: metric.key,
          original: originalValue,
          mean: originalValue,
          median: originalValue,
          percentile: "N/A",
          valid: false,
          reason,
        };
      }
      const bump =
        section.key === "total"
          ? 1
          : section.key === "random"
            ? between(sRnd, 0.94, 1.06)
            : between(sRnd, 0.88, 1.18);
      const mean =
        originalValue == null ? null : round(originalValue * bump, metric.decimals);
      const median =
        mean == null ? null : round(mean * between(sRnd, 0.96, 1.04), metric.decimals);
      return {
        metric: metric.key,
        original: originalValue,
        mean,
        median,
        percentile: round(between(sRnd, dynamic ? 8 : 20, dynamic ? 92 : 80), 1),
        valid: true,
        reason: null,
      };
    });
    return {
      key: section.key,
      label: section.label,
      n,
      stoppedN: Math.floor(n * between(sRnd, 0, 0.06)),
      warningsN: Math.floor(between(sRnd, 0, 14)),
      metrics,
    };
  });

  const maxddMean = core.find((c) => c.metric === "maxdd")?.mean ?? null;

  // Deterministic MaxDD sample for the Charts tab histogram.
  const chartBins = Array.from({ length: 10 }, (_, i) => {
    const bRnd = rngFor(["shuffler-chart", run.id, i]);
    return {
      label: `${i * 10}–${(i + 1) * 10}`,
      count: Math.round(between(bRnd, 2, Math.max(4, (Number(run.config?.shufflesN) || 100) / 8))),
    };
  });

  return {
    core,
    sections,
    maxddMean,
    resilience: { score: Math.round(between(rnd, 28, 96)) },
    chartBins,
    diagnostics: BT_SHUFFLER_DIAGNOSTIC_CODES.map((d) => ({
      code: d.code,
      count: Math.floor(between(rnd, 0, d.critical ? 6 : 22)),
      critical: d.critical,
    })).filter((d) => d.count > 0),
  };
}

/* -------------------------------------------------------------- synthetic */

export function buildSyntheticResult(run, parent) {
  const rnd = rngFor(["synthetic", run.id]);
  const real = parent?.result?.core || {};
  const nRuns = Number(run.config?.nRuns) || 0;

  const core = BT_CORE_METRICS.map((metric) => {
    const realValue = real[metric.key] ?? null;
    const mRnd = rngFor(["synthetic-metric", run.id, metric.key]);
    const mean =
      realValue == null ? null : round(realValue * between(mRnd, 0.72, 1.24), metric.decimals);
    const median =
      mean == null ? null : round(mean * between(mRnd, 0.95, 1.05), metric.decimals);
    const min = mean == null ? null : round(mean * between(mRnd, 0.35, 0.7), metric.decimals);
    const max = mean == null ? null : round(mean * between(mRnd, 1.3, 2.1), metric.decimals);
    return {
      metric: metric.key,
      real: realValue,
      percentile: round(between(mRnd, 5, 95), 1),
      min,
      median,
      mean,
      max,
      star: metric.kind === "drawdown" ? "max" : "none",
    };
  });

  return {
    core,
    nValid: Math.max(0, nRuns - Math.floor(between(rnd, 0, Math.max(1, nRuns * 0.05)))),
  };
}

/** Compact percentile summary shown in the Level 1 Synthetic row. */
export function syntheticPercentileSummary(result) {
  if (!result?.core) return null;
  const pf = result.core.find((c) => c.metric === "pf");
  const dd = result.core.find((c) => c.metric === "maxdd");
  return { pfPct: pf?.percentile ?? null, maxddPct: dd?.percentile ?? null };
}
