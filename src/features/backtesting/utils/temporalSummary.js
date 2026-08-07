// Stage 5 · Temporal metrics summary mock (Backtesting info → Temporal tab).

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

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const between = (rnd, lo, hi) => lo + rnd() * (hi - lo);

function parseYear(iso) {
  if (!iso) return null;
  const y = Number(String(iso).slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function fmtPctAbs(pct, abs) {
  const p = Number(pct);
  const a = Number(abs);
  const pctStr = Number.isFinite(p) ? `${p.toFixed(2)}%` : "—";
  const absStr = Number.isFinite(a)
    ? a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  return `${pctStr} | ${absStr}`;
}

function fmtAbs(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resolveYears(run) {
  const from = parseYear(run?.params?.periodFrom);
  const to = parseYear(run?.params?.periodTo);
  let start = from ?? 2020;
  let end = to ?? 2026;
  if (end < start) end = start;
  // Demo richness: if the run spans < 3 years, widen around it (capped).
  if (end - start < 2) {
    start = Math.max(2018, start - 2);
    end = Math.min(2026, end + 3);
  }
  const years = [];
  for (let y = start; y <= end; y += 1) years.push(y);
  return years;
}

function buildPeriodSections(rnd, startingCapital, isAll) {
  const scale = isAll ? 1 : between(rnd, 0.15, 0.55);
  const startTradable = round(startingCapital * between(rnd, 0.7, 1.05), 2);
  const pnlTradableAbs = round(startTradable * between(rnd, -0.35, 0.45) * scale, 2);
  const endTradable = round(startTradable + pnlTradableAbs, 2);
  const minTradable = round(Math.min(startTradable, endTradable) * between(rnd, 0.82, 0.98), 2);
  const maxTradable = round(Math.max(startTradable, endTradable) * between(rnd, 1.01, 1.18), 2);

  const reservedAbs = round(Math.max(0, pnlTradableAbs) * between(rnd, 0.05, 0.35), 2);
  const pnlTradablePct = round((pnlTradableAbs / Math.max(startTradable, 1e-9)) * 100, 2);
  const pnlReservedPct = round((reservedAbs / Math.max(startTradable, 1e-9)) * 100, 2);
  const pnlTotalAbs = round(pnlTradableAbs + reservedAbs, 2);
  const pnlTotalPct = round(pnlTradablePct + pnlReservedPct, 2);

  const startEquity = round(startTradable * between(rnd, 0.98, 1.04), 2);
  const endEquity = round(endTradable * between(rnd, 0.97, 1.05), 2);
  const minEquity = round(Math.min(startEquity, endEquity, minTradable) * between(rnd, 0.9, 1), 2);
  const maxEquity = round(Math.max(startEquity, endEquity, maxTradable) * between(rnd, 1, 1.08), 2);

  const peakTradable = maxTradable;
  const troughTradable = round(peakTradable * between(rnd, 0.55, 0.95), 2);
  const peakEquity = maxEquity;
  const troughEquity = round(peakEquity * between(rnd, 0.55, 0.95), 2);

  const maxDdTradPct = round(((peakTradable - troughTradable) / Math.max(peakTradable, 1e-9)) * 100, 2);
  const maxDdTradAbs = round(peakTradable - troughTradable, 2);
  const ddTradPct = round(((startTradable - minTradable) / Math.max(startTradable, 1e-9)) * 100, 2);
  const ddTradAbs = round(startTradable - minTradable, 2);
  const maxDdEqPct = round(((peakEquity - troughEquity) / Math.max(peakEquity, 1e-9)) * 100, 2);
  const maxDdEqAbs = round(peakEquity - troughEquity, 2);
  const ddEqPct = round(((startEquity - minEquity) / Math.max(startEquity, 1e-9)) * 100, 2);
  const ddEqAbs = round(startEquity - minEquity, 2);

  const feeAbs = round(-Math.abs(startTradable) * between(rnd, 0.002, 0.08) * scale, 2);
  const feePct = round((feeAbs / Math.max(startTradable, 1e-9)) * 100, 2);
  const fundingAbs = round(between(rnd, -40, 25) * scale, 2);
  const fundingPct = round((fundingAbs / Math.max(startTradable, 1e-9)) * 100, 2);

  const days = isAll ? Math.floor(between(rnd, 400, 2200)) : Math.floor(between(rnd, 200, 365));
  const cagrTrad = round(
    (Math.pow(Math.max(endTradable, 0.01) / Math.max(startTradable, 0.01), 1 / Math.max(days / 365, 0.05)) -
      1) *
      100,
    2,
  );
  const endTotal = endTradable + reservedAbs;
  const startTotal = startTradable;
  const cagrTotal = round(
    (Math.pow(Math.max(endTotal, 0.01) / Math.max(startTotal, 0.01), 1 / Math.max(days / 365, 0.05)) -
      1) *
      100,
    2,
  );

  const pairTone = (pct) => (pct > 0 ? "pos-text" : pct < 0 ? "neg-text" : "neutral-text");

  return [
    {
      key: "drawdowns",
      title: "DRAWDOWNS",
      hint: "Relative drawdowns on both axes. Tradable — on the trading balance, Equity — including open positions.",
      rows: [
        {
          key: "relMaxDdTradable",
          label: "Relative Max Drawdown Tradable",
          total: fmtPctAbs(maxDdTradPct, maxDdTradAbs),
          tone: "drawdown-text",
        },
        {
          key: "relDdTradable",
          label: "Relative Drawdown Tradable",
          total: fmtPctAbs(Math.max(0, ddTradPct), Math.max(0, ddTradAbs)),
          tone: "drawdown-text",
        },
        {
          key: "relMaxDdEquity",
          label: "Relative Max Equity Drawdown",
          total: fmtPctAbs(maxDdEqPct, maxDdEqAbs),
          tone: "drawdown-text",
        },
        {
          key: "relDdEquity",
          label: "Relative Equity Drawdown",
          total: fmtPctAbs(Math.max(0, ddEqPct), Math.max(0, ddEqAbs)),
          tone: "drawdown-text",
        },
      ],
    },
    {
      key: "pnl",
      title: "PNL",
      hint: "Result split across trading balance, reserve and the total of the two.",
      rows: [
        {
          key: "pnlTradable",
          label: "PnL Tradable",
          total: fmtPctAbs(pnlTradablePct, pnlTradableAbs),
          tone: pairTone(pnlTradablePct),
        },
        {
          key: "pnlReserved",
          label: "PnL Reserved",
          total: fmtPctAbs(pnlReservedPct, reservedAbs),
          tone: pairTone(pnlReservedPct),
        },
        {
          key: "pnlTotal",
          label: "PnL Total",
          total: fmtPctAbs(pnlTotalPct, pnlTotalAbs),
          tone: pairTone(pnlTotalPct),
        },
      ],
    },
    {
      key: "costs",
      title: "COSTS",
      hint: "What fees and funding took out of the period.",
      rows: [
        {
          key: "totalMakerTakerFee",
          label: "Total Maker/Taker Fee",
          total: fmtPctAbs(feePct, feeAbs),
          tone: "neg-text",
        },
        {
          key: "totalFundingFees",
          label: "Total Funding Fees",
          total: fmtPctAbs(fundingPct, fundingAbs),
          tone: pairTone(fundingAbs),
        },
      ],
    },
    {
      key: "return",
      title: "RETURN",
      hint: "Annualized growth rate for the period.",
      rows: [
        {
          key: "cagrTradable",
          label: "CAGR Tradable",
          total: `${cagrTrad.toFixed(2)}%`,
          tone: pairTone(cagrTrad),
        },
        {
          key: "cagrTotal",
          label: "CAGR Total",
          total: `${cagrTotal.toFixed(2)}%`,
          tone: pairTone(cagrTotal),
        },
      ],
    },
    {
      key: "tradable",
      title: "TRADING BALANCE (TRADABLE)",
      hint: "Balance without the reserve — what the strategy actually trades with.",
      rows: [
        { key: "startTradable", label: "Start Tradable", total: fmtAbs(startTradable), tone: "neutral-text" },
        { key: "endTradable", label: "End Tradable", total: fmtAbs(endTradable), tone: "neutral-text" },
        { key: "minTradable", label: "Min Tradable", total: fmtAbs(minTradable), tone: "neutral-text" },
        { key: "maxTradable", label: "Max Tradable", total: fmtAbs(maxTradable), tone: "neutral-text" },
      ],
    },
    {
      key: "equity",
      title: "EQUITY",
      hint: "Balance including the floating result of open positions.",
      rows: [
        { key: "startEquity", label: "Start Equity", total: fmtAbs(startEquity), tone: "neutral-text" },
        { key: "endEquity", label: "End Equity", total: fmtAbs(endEquity), tone: "neutral-text" },
        { key: "minEquity", label: "Min Equity", total: fmtAbs(minEquity), tone: "neutral-text" },
        { key: "maxEquity", label: "Max Equity", total: fmtAbs(maxEquity), tone: "neutral-text" },
      ],
    },
    {
      key: "peak",
      title: "PEAK AND RECOVERY",
      hint: "Where the peak was and how deep it fell afterwards.",
      rows: [
        {
          key: "maxTradableAtPeak",
          label: "Max Tradable at Peak",
          total: fmtAbs(peakTradable),
          tone: "neutral-text",
        },
        {
          key: "minTradableAfterPeak",
          label: "Min Tradable after Peak",
          total: fmtAbs(troughTradable),
          tone: "neutral-text",
        },
        {
          key: "maxEquityAtPeak",
          label: "Max Equity at Peak",
          total: fmtAbs(peakEquity),
          tone: "neutral-text",
        },
        {
          key: "minEquityAfterPeak",
          label: "Min Equity after Peak",
          total: fmtAbs(troughEquity),
          tone: "neutral-text",
        },
      ],
    },
  ];
}

/**
 * Temporal metrics summary: period pills + sections for each period.
 * Deterministic from run id.
 */
export function buildTemporalSummary(run) {
  const years = resolveYears(run);
  const startingCapital = Number(run?.params?.startingCapital) || 10000;
  const periods = [{ id: "all", label: "All period" }, ...years.map((y) => ({ id: String(y), label: String(y) }))];

  const byPeriod = {};
  for (const period of periods) {
    const rnd = mulberry32(strHash(["temporal", run?.id || "run", period.id].join("|")));
    byPeriod[period.id] = {
      sections: buildPeriodSections(rnd, startingCapital, period.id === "all"),
    };
  }

  return {
    periods,
    defaultPeriodId: periods[periods.length - 1]?.id || "all",
    byPeriod,
  };
}
