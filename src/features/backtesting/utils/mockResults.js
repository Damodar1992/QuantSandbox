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
  const shortOff = mode === "spot";
  const pairLabel = mode === "futures" || mode === "futures_isolated"
    ? `${pair}:USDT`
    : pair.includes(":")
      ? pair
      : `${pair}:USDT`;

  const days = Math.max(1, Math.floor(between(rnd, 180, 2800)));
  const annualPlPct = round((roi / days) * 365, 2);
  const cagrTotal = round(
    (Math.pow(Math.max(1 + roi / 100, 0.01), 365 / days) - 1) * 100,
    2,
  );

  const reservedShare = round(between(rnd, 0.05, 0.28), 3);
  const totalBalance = round(startingCapital + pnl * between(rnd, 0.75, 1.05), 2);
  const reserved = round(Math.max(0, (startingCapital + Math.max(pnl, 0)) * reservedShare), 2);
  const tradable = round(totalBalance - reserved, 2);
  const netPlTotal = round(totalBalance - startingCapital, 2);
  const netPlTotalPct = round((netPlTotal / Math.max(startingCapital, 1e-9)) * 100, 2);
  const tradablePctOfStart = round((tradable / Math.max(startingCapital, 1e-9) - 1) * 100, 2);
  const reservedPctOfStart = round((reserved / Math.max(startingCapital, 1e-9)) * 100, 2);
  const totalPctOfStart = round((totalBalance / Math.max(startingCapital, 1e-9) - 1) * 100, 2);

  const takerFee = round(-Math.abs(pnl) * between(rnd, 0.35, 0.55) - between(rnd, 50, 800), 2);
  const makerFee = round(between(rnd, 0, 1) > 0.7 ? between(rnd, -40, -2) : 0, 2);
  const fundingFees = mode === "spot" ? round(between(rnd, -5, 15), 2) : round(between(rnd, -80, 40), 2);
  const totalFees = round(makerFee + takerFee + fundingFees, 2);
  const takerOpen = round(takerFee * between(rnd, 0.48, 0.52), 2);
  const takerClose = round(takerFee - takerOpen, 2);
  const tradeVolume = round(Math.abs(startingCapital) * between(rnd, 80, 520), 2);

  const pctOfStart = (abs) =>
    `${signedPct(round((abs / Math.max(startingCapital, 1e-9)) * 100, 2))} of start`;

  const maxDdRealPct = round(maxdd * between(rnd, 0.92, 1.08), 2);
  const avgDdAccountPct = round(maxdd * between(rnd, 0.35, 0.85), 2);
  const maxDdRealUsdt = round((startingCapital * maxDdRealPct) / 100, 2);
  const maxDdAbsUsdt = round(maxDdRealUsdt * between(rnd, 0.97, 1.02), 2);

  const sortino = round(between(rnd, -25, 4), 2);
  const sharpe = round(between(rnd, -25, 3), 2);
  const calmar = round(annualPlPct / Math.max(maxDdRealPct, 0.01), 2);
  const expectancy = round(between(rnd, -1.2, 1.4), 2);
  const expectancyAlt = round(expectancy * between(rnd, 0.5, 0.85), 2);

  const lossRate = round(100 - winrate, 2);
  const avgDaily = round(trades / days, 2);
  const oclClosedPct = round(between(rnd, 0, 8), 1);
  const oclOtherPct = round(100 - oclClosedPct, 1);

  const pad2 = (n) => String(n).padStart(2, "0");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  const fmtDay = (y, m, d) => `${d} ${MONTHS[m - 1]} ${y}`;

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
  const maxLossAmount = round(-Math.abs(startingCapital) * between(rnd, 0.015, 0.08), 2);
  const avgLossAmount = round(maxLossAmount * between(rnd, 0.05, 0.2), 2);
  const maxWinCount = Math.max(2, Math.round(between(rnd, 3, 14)));
  const avgWinCount = round(between(rnd, 1.2, 3.2), 2);
  const maxWinAmount = round(startingCapital * between(rnd, 0.005, 0.04), 2);
  const avgWinAmount = round(maxWinAmount * between(rnd, 0.08, 0.25), 2);

  const longCount = shortOff ? trades : Math.floor(trades * between(rnd, 0.45, 0.62));
  const shortCount = shortOff ? 0 : trades - longCount;
  const netPlLongPct = shortOff ? roi : round(roi * between(rnd, 0.4, 0.6), 2);
  const netPlShortPct = shortOff ? null : round(roi - netPlLongPct, 2);
  const netPlLongUsdt = round((startingCapital * netPlLongPct) / 100, 2);

  const minBalance = round(startingCapital * between(rnd, 0.05, 0.4), 2);
  const maxBalance = round(startingCapital * between(rnd, 0.95, 1.4), 2);
  const marketChangePct = round(between(rnd, -40, 800), 2);

  const year = 2019 + Math.floor(between(rnd, 0, 5));
  const month = 1 + Math.floor(between(rnd, 0, 11));
  const day = 1 + Math.floor(between(rnd, 0, 27));
  const endMonth = Math.min(12, month + Math.floor(between(rnd, 1, 8)));
  const endDay = Math.min(28, day + Math.floor(between(rnd, 0, 20)));
  const endYear = endMonth < month ? year + 1 : year;
  const ddDays = Math.max(1, Math.floor(between(rnd, 30, 400)));
  const ddRange = `${fmtDay(year, month, day)} → ${fmtDay(endYear, endMonth, endDay)}`;
  const ddHigh = round(-between(rnd, 0.1, 5), 2);
  const ddLow = round(-maxDdAbsUsdt * between(rnd, 0.98, 1.05), 2);

  const winDays = Math.floor(between(rnd, 10, 80));
  const drawDays = Math.floor(between(rnd, 0, 5));
  const loseDays = Math.floor(between(rnd, 40, 400));
  const bestDayPct = round(between(rnd, 1, 25), 2);
  const worstDayPct = round(-between(rnd, 5, 90), 2);
  const bestTradePct = round(between(rnd, 2, 40), 2);
  const worstTradePct = round(-between(rnd, 5, 50), 2);
  const avgDurWinnersMin = Math.floor(durAvg / 60) + 20;
  const avgDurLosersMin = Math.max(5, Math.floor(durAvg / 60) - 10);

  // Synthetic direction split — always long + short with pct / USDT pairs (reference layout).
  const synthLongShare = between(rnd, 0.52, 0.58);
  const synthLongCount = Math.max(1, Math.round(trades * synthLongShare));
  const synthShortCount = Math.max(0, trades - synthLongCount);
  const synthNetPlLongPct = round(roi * between(rnd, 0.45, 0.55), 2);
  const synthNetPlShortPct = round(roi - synthNetPlLongPct, 2);
  const synthNetPlLongUsdt = round((startingCapital * synthNetPlLongPct) / 100, 2);
  const synthNetPlShortUsdt = round((startingCapital * synthNetPlShortPct) / 100, 2);
  const pctUsdtPair = (pct, usdt) => `${signedPct(pct)} / ${signedMoney(usdt)} USDT`;

  const metric = (key, label, total, tone, extra = {}) => ({
    key,
    label,
    total,
    tone,
    ...extra,
  });

  const hero = [
    {
      key: "netPlTotalPct",
      label: "Net P/L total, %",
      value: netPlTotalPct,
      tone: "signed",
      suffix: "%",
      sub: `${signedMoney(netPlTotal)} USDT · tradable + reserved`,
    },
    {
      key: "marketChange",
      label: "Market change",
      value: marketChangePct,
      tone: "signed",
      suffix: "%",
      sub: "benchmark over the same period",
    },
    {
      key: "cagr",
      label: "CAGR total",
      value: cagrTotal,
      tone: "signed",
      suffix: "%",
      sub: "annualized compounded",
    },
    {
      key: "maxDdRealPct",
      label: "Max drawdown, real %",
      value: maxDdRealPct,
      tone: "drawdown-pct",
      suffix: "%",
      sub: `${fmtNumLocal(maxDdRealUsdt)} USDT · relative real equity`,
    },
    {
      key: "calmar",
      label: "Calmar",
      value: calmar,
      tone: "signed",
      sub: "return per unit of drawdown",
    },
    {
      key: "profitFactor",
      label: "Profit factor",
      value: pf,
      tone: "pf",
      sub: "gross profit ÷ gross loss",
    },
  ];

  const columns = [
    {
      key: "left",
      sections: [
        {
          key: "returns",
          title: "RETURNS",
          hint: "P/L split by tradable balance and direction.",
          rows: [
            metric("netPlPct", "Net P/L tradable, %", signedPct(roi), roi >= 0 ? "pos-text" : "neg-text", {
              sub: `${signedMoney(pnl)} USDT`,
            }),
            metric(
              "netPlLong",
              "Net P/L long",
              signedPct(netPlLongPct),
              netPlLongPct >= 0 ? "pos-text" : "neg-text",
              { sub: `${signedMoney(netPlLongUsdt)} USDT` },
            ),
            metric(
              "netPlShort",
              shortOff ? "Net P/L short [SHORT OFF]" : "Net P/L short",
              shortOff ? "—" : signedPct(netPlShortPct),
              shortOff ? "neutral-text" : netPlShortPct >= 0 ? "pos-text" : "neg-text",
            ),
            metric(
              "longShortCounts",
              shortOff ? "Long / short trades [SHORT OFF]" : "Long / short trades",
              shortOff
                ? `${longCount.toLocaleString("en-US")} / —`
                : `${longCount.toLocaleString("en-US")} / ${shortCount.toLocaleString("en-US")}`,
              "neutral-text",
            ),
            metric("annualPl", "Annual P/L, %", signedPct(annualPlPct), annualPlPct >= 0 ? "pos-text" : "neg-text"),
          ],
        },
        {
          key: "risk",
          title: "RISK",
          hint: "Drawdowns and risk-adjusted ratios.",
          rows: [
            metric("maxDdAccount", "Max drawdown, account %", `${fmtNumLocal(maxdd)}%`, "drawdown-text"),
            metric("avgDd", "Avg drawdown, %", `${fmtNumLocal(avgDdAccountPct)}%`, "drawdown-text"),
            metric("ddDuration", "Drawdown duration", `${ddDays} days`, "neutral-text", { sub: ddRange }),
            metric(
              "minMaxBalance",
              "Min / max balance",
              `${fmtNumLocal(minBalance)} / ${fmtNumLocal(maxBalance)} USDT`,
              "neutral-text",
            ),
            metric("sortino", "Sortino", fmtNumLocal(sortino), sortino >= 0 ? "pos-text" : "neg-text"),
            metric("sharpe", "Sharpe", fmtNumLocal(sharpe), sharpe >= 0 ? "pos-text" : "neg-text"),
            metric("maxDdAbs", "Max drawdown, ABS", `${fmtNumLocal(maxDdAbsUsdt)} USDT`, "drawdown-text"),
            metric(
              "ddHighLow",
              "Drawdown high | low",
              `${signedMoney(ddHigh)} / ${signedMoney(ddLow)} USDT`,
              "neg-text",
            ),
          ],
        },
      ],
    },
    {
      key: "middle",
      sections: [
        {
          key: "capital",
          title: "CAPITAL",
          hint: "Where the capital ended up after the run.",
          rows: [
            metric("tradable", "Tradable amount", `${fmtNumLocal(tradable)} USDT`, "neutral-text", {
              sub: `${signedPct(tradablePctOfStart)} of start`,
            }),
            metric("reserved", "Reserved amount", `${fmtNumLocal(reserved)} USDT`, "neutral-text", {
              sub: `${signedPct(reservedPctOfStart)} of start`,
            }),
            metric("totalBal", "Total balance", `${fmtNumLocal(totalBalance)} USDT`, "neutral-text", {
              sub: `${signedPct(totalPctOfStart)} of start · ${fmtNumLocal(tradable)} + ${fmtNumLocal(reserved)}`,
            }),
            metric(
              "ratio",
              "Ratio",
              fmtNumLocal(round(reserved / Math.max(tradable, 1e-9), 4), 4),
              "neutral-text",
            ),
          ],
        },
        {
          key: "tradeEdge",
          title: "TRADE EDGE",
          hint: "Edge per trade — win rate, expectancy, extremes.",
          rows: [
            metric(
              "winrate",
              "Win rate (wins / losses)",
              `${fmtNumLocal(winrate)}% / ${fmtNumLocal(lossRate)}%`,
              "neutral-text",
              {
                sub: `wins / losses of ${trades.toLocaleString("en-US")}: ${wins.toLocaleString("en-US")} / ${losses.toLocaleString("en-US")} trades`,
              },
            ),
            metric(
              "expectancy",
              "Expectancy (ratio)",
              `${fmtNumLocal(expectancy)} (${fmtNumLocal(expectancyAlt)})`,
              expectancy >= 0 ? "pos-text" : "neg-text",
            ),
            metric(
              "avgDurWinnersLosers",
              "Avg duration, winners / losers",
              `${avgDurWinnersMin} min / ${avgDurLosersMin} min`,
              "neutral-text",
            ),
            metric(
              "bestWorstTrade",
              "Best / worst single trade",
              `${signedPct(bestTradePct)} / ${signedPct(worstTradePct)}`,
              "neutral-text",
            ),
          ],
        },
        {
          key: "consistency",
          title: "CONSISTENCY",
          hint: "Day-level outcome and consecutive streaks.",
          rows: [
            metric(
              "outcomeDays",
              "Winning / draw / losing days",
              `${winDays} / ${drawDays} / ${loseDays}`,
              "neutral-text",
            ),
            metric(
              "bestWorstDay",
              "Best / worst day",
              `${signedPct(bestDayPct)} / ${signedPct(worstDayPct)}`,
              "neutral-text",
            ),
            metric("maxLossN", "Losses, max count", `${maxLossCount} trades`, "neg-text", {
              sub: `${signedMoney(maxLossAmount)} USDT`,
            }),
            metric("avgLossN", "Losses, avg count", `${fmtNumLocal(avgLossCount)} trades`, "neg-text", {
              sub: `${signedMoney(avgLossAmount)} USDT`,
            }),
            metric("maxWinN", "Wins, max count", `${maxWinCount} trades`, "pos-text", {
              sub: `${signedMoney(maxWinAmount)} USDT`,
            }),
            metric("avgWinN", "Wins, avg count", `${fmtNumLocal(avgWinCount)} trades`, "pos-text", {
              sub: `${signedMoney(avgWinAmount)} USDT`,
            }),
          ],
        },
      ],
    },
    {
      key: "right",
      sections: [
        {
          key: "costs",
          title: "COSTS",
          hint: "What trading cost — exchange fees and funding.",
          rows: [
            metric(
              "totalFees",
              "Total fees (maker + taker + funding)",
              `${signedMoney(totalFees)} USDT`,
              "neg-text",
              { sub: pctOfStart(totalFees) },
            ),
            metric(
              "tradeVolume",
              "Total trade volume",
              `${fmtNumLocal(tradeVolume)} USDT`,
              "neutral-text",
            ),
            metric("taker", "Taker fee", `${signedMoney(takerFee)} USDT`, "neg-text", {
              sub: `${pctOfStart(takerFee)} · OPEN: ${signedMoney(takerOpen)} · CLOSE: ${signedMoney(takerClose)}`,
            }),
            metric("maker", "Maker fee", `${signedMoney(makerFee)} USDT`, makerFee < 0 ? "neg-text" : "neutral-text", {
              sub: pctOfStart(makerFee),
            }),
            metric(
              "funding",
              "Funding fees",
              `${signedMoney(fundingFees)} USDT`,
              fundingFees >= 0 ? "pos-text" : "neg-text",
              { sub: pctOfStart(fundingFees) },
            ),
          ],
        },
        {
          key: "mechanics",
          title: "SAMPLE AND MECHANICS",
          hint: "Sample size, trade size, duration and downtime.",
          rows: [
            metric("trades", "Total trades", trades.toLocaleString("en-US"), "neutral-text", {
              sub: `over ${days.toLocaleString("en-US")} days`,
            }),
            metric("avgDaily", "Avg daily trades", fmtNumLocal(avgDaily), "neutral-text"),
            metric("sizeAvg", "Trade size · Avg", `${fmtNumLocal(sizeAvg)} USDT`, "neutral-text", {
              sub: `MIN ${fmtNumLocal(sizeMin)} · MAX ${fmtNumLocal(sizeMax)} USDT`,
            }),
            metric("durAvg", "Trade duration · Avg", fmtHms(durAvg), "neutral-text", {
              sub: `MIN ${fmtHms(durMin)} · MAX ${fmtHms(durMax)}`,
            }),
            metric("downAvg", "Downtime · Avg", fmtDaysHms(downAvg), "neutral-text", {
              sub: `MIN ${fmtDaysHms(downMin)} · MAX ${fmtDaysHms(downMax)}`,
            }),
            metric(
              "ccl",
              "Trades closed by CCL",
              `${fmtNumLocal(oclClosedPct)}% / ${fmtNumLocal(oclOtherPct)}%`,
              "neutral-text",
            ),
          ],
        },
      ],
    },
  ];

  // Flattened shape for Excel export + Synthetic distribution table.
  const sections = columns.flatMap((col) => col.sections);
  const cards = [
    {
      key: "hero",
      title: "Overview",
      rows: hero.map((h) => ({
        key: h.key,
        label: h.label,
        value: h.value,
        text: h.sub,
        tone: h.tone,
        suffix: h.suffix,
      })),
    },
  ];

  const drawTrades = Math.max(0, trades - wins - losses);
  const ddStart = fmtDay(year, month, day);
  const ddEnd = fmtDay(endYear, endMonth, endDay);

  const syntheticRows = [
    metric("netPlPct", "Net P/L tradable, %", signedPct(roi), roi >= 0 ? "pos-text" : "neg-text"),
    metric("netPlUsdt", "Net P/L tradable, USDT", `${signedMoney(pnl)} USDT`, pnl >= 0 ? "pos-text" : "neg-text"),
    metric("annualPl", "Annual P/L, %", signedPct(annualPlPct), annualPlPct >= 0 ? "pos-text" : "neg-text"),
    metric(
      "netPlTotal",
      "Net P/L total, USDT",
      `${signedMoney(netPlTotal)} USDT`,
      netPlTotal >= 0 ? "pos-text" : "neg-text",
    ),
    metric("maxDdAccount", "Max drawdown, account %", `${fmtNumLocal(maxdd)}%`, "drawdown-text"),
    metric("avgDd", "Avg drawdown, %", `${fmtNumLocal(avgDdAccountPct)}%`, "drawdown-text"),
    metric("maxDdRealPct", "Max drawdown, real %", `${fmtNumLocal(maxDdRealPct)}%`, "drawdown-text"),
    metric("maxDdRealUsdt", "Max drawdown, real USDT", `${fmtNumLocal(maxDdRealUsdt)} USDT`, "drawdown-text"),
    metric("maxDdAbs", "Max drawdown, ABS", `${fmtNumLocal(maxDdAbsUsdt)} USDT`, "drawdown-text"),
    metric("tradable", "Tradable amount", `${fmtNumLocal(tradable)} USDT`, "neutral-text"),
    metric("reserved", "Reserved amount", `${fmtNumLocal(reserved)} USDT`, "neutral-text"),
    metric("totalBal", "Total balance", `${fmtNumLocal(totalBalance)} USDT`, "neutral-text"),
    metric(
      "ratio",
      "Ratio",
      fmtNumLocal(round(reserved / Math.max(tradable, 1e-9), 4), 4),
      "neutral-text",
    ),
    metric("minBalance", "Min balance", `${fmtNumLocal(minBalance)} USDT`, "neutral-text"),
    metric("maxBalance", "Max balance", `${fmtNumLocal(maxBalance)} USDT`, "neutral-text"),
    metric("marketChange", "Market change", signedPct(marketChangePct), marketChangePct >= 0 ? "pos-text" : "neg-text"),
    metric("cagr", "CAGR total", signedPct(cagrTotal), cagrTotal >= 0 ? "pos-text" : "neg-text"),
    metric("sortino", "Sortino", fmtNumLocal(sortino), sortino >= 0 ? "pos-text" : "neg-text"),
    metric("sharpe", "Sharpe", fmtNumLocal(sharpe), sharpe >= 0 ? "pos-text" : "neg-text"),
    metric("calmar", "Calmar", fmtNumLocal(calmar), calmar >= 0 ? "pos-text" : "neg-text"),
    metric(
      "expectancy",
      "Expectancy (ratio)",
      `${fmtNumLocal(expectancy)} (${fmtNumLocal(expectancyAlt)})`,
      expectancy >= 0 ? "pos-text" : "neg-text",
    ),
    metric("profitFactor", "Profit factor", fmtNumLocal(pf), pf >= 1 ? "pos-text" : "neg-text"),
    metric("maxLossN", "Losses, max count", `${maxLossCount} trades`, "neg-text"),
    metric("avgLossN", "Losses, avg count", `${fmtNumLocal(avgLossCount)} trades`, "neg-text"),
    metric("maxLossAmt", "Losses, max amount", `${signedMoney(maxLossAmount)} USDT`, "neg-text"),
    metric("avgLossAmt", "Losses, avg amount", `${signedMoney(avgLossAmount)} USDT`, "neg-text"),
    metric("maxWinN", "Wins, max count", `${maxWinCount} trades`, "pos-text"),
    metric("avgWinN", "Wins, avg count", `${fmtNumLocal(avgWinCount)} trades`, "pos-text"),
    metric("maxWinAmt", "Wins, max amount", `${signedMoney(maxWinAmount)} USDT`, "pos-text"),
    metric("avgWinAmt", "Wins, avg amount", `${signedMoney(avgWinAmount)} USDT`, "pos-text"),
    metric(
      "ddHighLow",
      "Drawdown high | low",
      `${signedMoney(ddHigh)} / ${signedMoney(ddLow)} USDT`,
      "neg-text",
    ),
    metric("ddStart", "Drawdown start", ddStart, "neutral-text"),
    metric("ddEnd", "Drawdown end", ddEnd, "neutral-text"),
    metric("days", "Backtesting days", days.toLocaleString("en-US"), "neutral-text"),
    metric("trades", "Total trades", trades.toLocaleString("en-US"), "neutral-text"),
    metric("avgDaily", "Avg daily trades", fmtNumLocal(avgDaily), "neutral-text"),
    metric(
      "winrate",
      "Win rate (wins / losses)",
      `${fmtNumLocal(winrate)}% / ${fmtNumLocal(lossRate)}%`,
      "neutral-text",
    ),
    metric(
      "ccl",
      "Trades closed by CCL",
      `${fmtNumLocal(oclClosedPct)}% / ${fmtNumLocal(oclOtherPct)}%`,
      "neutral-text",
    ),
    metric(
      "outcomeCounts",
      "Wins / draws / losses",
      `${wins.toLocaleString("en-US")} / ${drawTrades.toLocaleString("en-US")} / ${losses.toLocaleString("en-US")}`,
      "neutral-text",
    ),
    metric(
      "outcomeDays",
      "Winning / draw / losing days",
      `${winDays} / ${drawDays} / ${loseDays}`,
      "neutral-text",
    ),
    metric("avgDurWinners", "Avg duration, winners", `${avgDurWinnersMin} min`, "neutral-text"),
    metric("avgDurLosers", "Avg duration, losers", `${avgDurLosersMin} min`, "neutral-text"),
    metric("bestDay", "Best day", signedPct(bestDayPct), "pos-text"),
    metric("worstDay", "Worst day", signedPct(worstDayPct), "neg-text"),
    metric("bestTrade", "Best single trade", signedPct(bestTradePct), "pos-text"),
    metric("worstTrade", "Worst single trade", signedPct(worstTradePct), "neg-text"),
    metric("maker", "Maker fee", `${signedMoney(makerFee)} USDT`, makerFee < 0 ? "neg-text" : "neutral-text"),
    metric("taker", "Taker fee", `${signedMoney(takerFee)} USDT`, "neg-text"),
    metric(
      "funding",
      "Funding fees",
      `${signedMoney(fundingFees)} USDT`,
      fundingFees >= 0 ? "pos-text" : "neg-text",
    ),
    metric(
      "totalFees",
      "Total fees (maker + taker + funding)",
      `${signedMoney(totalFees)} USDT`,
      "neg-text",
    ),
    metric("sizeAvg", "Avg", `${fmtNumLocal(sizeAvg)} USDT`, "neutral-text"),
    metric("sizeMin", "Min", `${fmtNumLocal(sizeMin)} USDT`, "neutral-text"),
    metric("sizeMax", "Max", `${fmtNumLocal(sizeMax)} USDT`, "neutral-text"),
    metric("durAvg", "Avg", fmtHms(durAvg), "neutral-text"),
    metric("durMin", "Min", fmtHms(durMin), "neutral-text"),
    metric("durMax", "Max", fmtHms(durMax), "neutral-text"),
    metric("downAvg", "Avg", fmtDaysHms(downAvg), "neutral-text"),
    metric("downMin", "Min", fmtDaysHms(downMin), "neutral-text"),
    metric("downMax", "Max", fmtDaysHms(downMax), "neutral-text"),
    metric(
      "longShortCounts",
      "Long / short trades",
      `${synthLongCount.toLocaleString("en-US")} / ${synthShortCount.toLocaleString("en-US")}`,
      "neutral-text",
    ),
    metric(
      "netPlLong",
      "Net P/L long",
      pctUsdtPair(synthNetPlLongPct, synthNetPlLongUsdt),
      synthNetPlLongPct >= 0 ? "pos-text" : "neg-text",
    ),
    metric(
      "netPlShort",
      "Net P/L short",
      pctUsdtPair(synthNetPlShortPct, synthNetPlShortUsdt),
      synthNetPlShortPct >= 0 ? "pos-text" : "neg-text",
    ),
  ];

  return { pairLabel, hero, columns, sections, cards, syntheticRows };
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
