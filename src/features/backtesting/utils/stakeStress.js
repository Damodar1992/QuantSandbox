// Stake stress-test, path 2. Preview only: prices and dates stay on the tape,
// money is rebuilt from those prices at a new stake. The 30% min-stake bump
// is off (open question in the spec) — a stake below the pair minimum is a skip.

export const TRADABLE_BALANCE_RATIO = 0.99;
export const FEE_RATE = 0.0005;

export const SKIP = {
  NO_MONEY: "no_money",
  BELOW_MIN: "below_min",
  ZERO_AMOUNT: "zero_amount",
  NO_SLOT: "no_slot",
};

const CHEAP_PAIR = "DOGE/USDT";

const PAIR_LIMITS = {
  "BTC/USDT": { lotStep: 0.001, contractSize: 0.001, minAmount: 0.001, minNotional: 5, maxStake: 1_000_000, refPrice: 60000 },
  "ETH/USDT": { lotStep: 0.01, contractSize: 0.01, minAmount: 0.01, minNotional: 5, maxStake: 500_000, refPrice: 3000 },
  "SOL/USDT": { lotStep: 0.01, contractSize: 0.01, minAmount: 0.01, minNotional: 5, maxStake: 400_000, refPrice: 150 },
  "DOGE/USDT": { lotStep: 1, contractSize: 1, minAmount: 1, minNotional: 1, maxStake: 250_000, refPrice: 0.15 },
};

export function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function hashString(str) {
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

function stepDecimals(step) {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

export function floorToStep(value, step) {
  if (!(step > 0) || !Number.isFinite(value) || value <= 0) return 0;
  const n = Math.floor(value / step + 1e-8);
  return Number((n * step).toFixed(stepDecimals(step)));
}

export function canonicalPair(pair) {
  const text = String(pair || "BTC/USDT");
  const base = text.split(":")[0];
  return PAIR_LIMITS[base] ? base : "BTC/USDT";
}

export function pairLimits(pair) {
  return PAIR_LIMITS[canonicalPair(pair)];
}

export function limitsForPairs(pairs) {
  const out = {};
  for (const pair of pairs) out[canonicalPair(pair)] = pairLimits(pair);
  return out;
}

/** Stake the user asked for, before lot rounding. `value` is USDT, or percent points (15 = 15%). */
export function targetStake({ mode, value, free, tradableRatio = TRADABLE_BALANCE_RATIO, openCount = 0 }) {
  if (mode === "percent") {
    const rel = Number(value) / 100;
    if (!(rel > 0) || rel >= 1) {
      return { stake: 0, slots: 0, freeSlots: 0, noSlot: true };
    }
    const slots = Math.floor(1 / rel);
    const freeSlots = slots - openCount;
    if (!(freeSlots > 0)) return { stake: 0, slots, freeSlots: 0, noSlot: true };
    const stake = free * tradableRatio * rel * slots / freeSlots;
    return { stake, slots, freeSlots, noSlot: false };
  }
  return { stake: Number(value) || 0, slots: null, freeSlots: null, noSlot: false };
}

export function minStakeFor(openRate, leverage, limits, stoploss = 0) {
  const base = Math.max(Number(limits.minNotional) || 0, (Number(limits.minAmount) || 0) * openRate);
  const lev = Number(leverage) || 1;
  return base * (1 + Math.abs(Number(stoploss) || 0)) / lev;
}

function amountStep(limits) {
  return Math.max(Number(limits.lotStep) || 0, Number(limits.contractSize) || 0);
}

/**
 * Rebuild one fill on `amountNew`. If the recorded parts do not match profit_abs,
 * fall back to net = r × stake_real.
 */
export function moneyOnAmount(trade, amountNew, stakeReal) {
  const amount0 = Number(trade.amount) || 0;
  const open = Number(trade.openRate) || 0;
  const close = Number(trade.closeRate) || 0;
  const sign = trade.isShort ? -1 : 1;
  const feeOpen = Number(trade.feeOpenCost) || 0;
  const feeClose = Number(trade.feeCloseCost) || 0;
  const funding0 = Number(trade.fundingFees) || 0;
  const fIn = amount0 * open !== 0 ? -feeOpen / (amount0 * open) : 0;
  const fOut = amount0 * close !== 0 ? -feeClose / (amount0 * close) : 0;
  const gross0 = round2(amount0 * (close - open) * sign);
  const feeIn0 = round2(-amount0 * open * fIn);
  const feeOut0 = round2(-amount0 * close * fOut);
  const netCheck = round2(gross0 + feeIn0 + feeOut0 + round2(funding0));
  const recorded = round2(trade.profitAbs);
  const byCoefficient = Math.abs(netCheck - recorded) > 0.005;
  if (byCoefficient) {
    const basis = Number(trade.stakeAmount) || 0;
    const r = basis ? Number(trade.profitAbs) / basis : 0;
    return {
      byCoefficient: true,
      gross: null,
      feeIn: null,
      feeOut: null,
      funding: null,
      net: round2(r * stakeReal),
    };
  }
  const gross = round2(amountNew * (close - open) * sign);
  const feeIn = round2(-amountNew * open * fIn);
  const feeOut = round2(-amountNew * close * fOut);
  const funding = round2(amount0 ? funding0 * (amountNew / amount0) : 0);
  return {
    byCoefficient: false,
    gross,
    feeIn,
    feeOut,
    funding,
    net: round2(gross + feeIn + feeOut + funding),
  };
}

function limitsOf(trade, limitsByPair) {
  return limitsByPair?.[canonicalPair(trade.pair)] || pairLimits(trade.pair);
}

/**
 * Walk OPEN/CLOSE. Same timestamp: all closes before opens, then pair name.
 * A skipped trade does nothing on its close.
 */
export function simulateStakeStress(trades, config) {
  const start = round2(config.start);
  const reservePct = (Number(config.reservePct) || 0) / 100;
  const tradableRatio = config.tradableRatio ?? TRADABLE_BALANCE_RATIO;
  const stoploss = Number(config.stoploss) || 0;
  const mode = config.mode === "percent" ? "percent" : "fixed";
  const value = Number(config.value) || 0;
  const list = (trades || []).map((trade, index) => ({ ...trade, index }));

  const events = [];
  for (const trade of list) {
    events.push({ kind: "OPEN", time: trade.openDate, trade });
    events.push({ kind: "CLOSE", time: trade.closeDate, trade });
  }
  events.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    if (a.kind !== b.kind) return a.kind === "CLOSE" ? -1 : 1;
    const pair = String(a.trade.pair).localeCompare(String(b.trade.pair));
    if (pair) return pair;
    return a.trade.index - b.trade.index;
  });

  let tradable = start;
  let reserved = 0;
  let locked = 0;
  let cum = 0;
  let peak = 0;
  let maxDd = 0;
  let maxDdPct = 0;
  let minTradable = start;
  const openById = new Map();
  const rowById = new Map();

  const touchMin = () => {
    minTradable = round2(Math.min(minTradable, tradable));
  };

  for (const event of events) {
    const trade = event.trade;
    if (event.kind === "CLOSE") {
      const opened = openById.get(trade.id);
      if (!opened) continue;
      openById.delete(trade.id);
      const parts = opened.parts;
      const net = parts.net;
      const reserve = net > 0 ? round2(reservePct * net) : 0;
      tradable = round2(tradable + net - reserve);
      reserved = round2(reserved + reserve);
      locked = round2(locked - opened.stakeReal);
      const step = round2(net - reserve);
      cum = round2(cum + step);
      if (cum > peak) peak = cum;
      const dd = round2(peak - cum);
      if (dd > maxDd) {
        maxDd = dd;
        const denom = start + peak;
        maxDdPct = denom > 0 ? round2((dd / denom) * 100) : 0;
      }
      touchMin();
      rowById.set(trade.id, {
        ...opened.row,
        gross: parts.gross,
        feeIn: parts.feeIn,
        feeOut: parts.feeOut,
        funding: parts.funding,
        net,
        reserve,
        tradableAfter: tradable,
        totalAfter: round2(tradable + reserved),
        byCoefficient: parts.byCoefficient,
      });
      continue;
    }

    const limits = limitsOf(trade, config.limits);
    const free = round2(tradable - locked);
    const openCount = openById.size;
    const aimed = targetStake({ mode, value, free, tradableRatio, openCount });
    let stake = aimed.stake;
    const maxStake = Number(limits.maxStake);
    if (maxStake > 0) stake = Math.min(stake, maxStake);
    const minStake = minStakeFor(trade.openRate, trade.leverage, limits, stoploss);
    const baseRow = {
      id: trade.id,
      index: trade.index,
      pair: canonicalPair(trade.pair),
      isShort: Boolean(trade.isShort),
      openDate: trade.openDate,
      openRate: trade.openRate,
      leverage: trade.leverage,
      targetStake: round2(stake),
      minStake: round2(minStake),
      freeAtOpen: free,
      byCoefficient: false,
      amountNew: 0,
      stakeReal: 0,
      gross: null,
      feeIn: null,
      feeOut: null,
      funding: null,
      net: null,
      reserve: null,
      tradableAfter: null,
      totalAfter: null,
    };

    let status = null;
    if (aimed.noSlot) status = SKIP.NO_SLOT;
    else if (!(free >= stake)) status = SKIP.NO_MONEY;
    else if (!(stake >= minStake)) status = SKIP.BELOW_MIN;

    if (status) {
      rowById.set(trade.id, { ...baseRow, status });
      continue;
    }

    const amountNew = floorToStep((stake * (Number(trade.leverage) || 1)) / Number(trade.openRate), amountStep(limits));
    if (!(amountNew > 0)) {
      rowById.set(trade.id, { ...baseRow, status: SKIP.ZERO_AMOUNT });
      continue;
    }
    const stakeReal = round2(amountNew * Number(trade.openRate) / (Number(trade.leverage) || 1));
    const parts = moneyOnAmount(trade, amountNew, stakeReal);
    locked = round2(locked + stakeReal);
    const row = {
      ...baseRow,
      status: "opened",
      amountNew,
      stakeReal,
      byCoefficient: parts.byCoefficient,
    };
    openById.set(trade.id, { stakeReal, parts, row });
  }

  const rows = list.map((trade) => rowById.get(trade.id) || {
    id: trade.id,
    index: trade.index,
    pair: canonicalPair(trade.pair),
    status: SKIP.NO_MONEY,
    targetStake: 0,
    minStake: 0,
    amountNew: 0,
    stakeReal: 0,
    net: null,
  });

  let stopAt = null;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows.slice(i).every((row) => row.status !== "opened")) {
      stopAt = i + 1;
      break;
    }
  }

  const opened = rows.filter((row) => row.status === "opened");
  const skips = { no_money: 0, below_min: 0, zero_amount: 0, no_slot: 0 };
  for (const row of rows) {
    if (row.status && row.status !== "opened" && skips[row.status] != null) skips[row.status] += 1;
  }
  const pairMap = new Map();
  for (const row of rows) {
    const bucket = pairMap.get(row.pair) || { pair: row.pair, skipped: 0, total: 0 };
    bucket.total += 1;
    if (row.status !== "opened") bucket.skipped += 1;
    pairMap.set(row.pair, bucket);
  }
  const sumNet = round2(opened.reduce((sum, row) => sum + (Number(row.net) || 0), 0));
  const sumProfit = round2(list.reduce((sum, trade) => sum + (Number(trade.profitAbs) || 0), 0));
  const wins = opened.filter((row) => Number(row.net) > 0).length;
  const grossProfit = opened.reduce((sum, row) => sum + Math.max(0, Number(row.net) || 0), 0);
  const grossLoss = opened.reduce((sum, row) => sum + Math.min(0, Number(row.net) || 0), 0);
  const total = round2(tradable + reserved);
  const pnl = round2(total - start);
  const avgStake = opened.length
    ? opened.reduce((sum, row) => sum + row.stakeReal, 0) / opened.length
    : 0;
  const stakeDenom = mode === "fixed" ? value : avgStake;

  return {
    summary: {
      mode,
      value,
      total,
      pnl,
      roi: start ? round2((pnl / start) * 100) : 0,
      maxDdUsdt: round2(maxDd),
      maxDdPct,
      pnlPerStake: stakeDenom ? round2(pnl / stakeDenom) : null,
      ddInStakes: stakeDenom ? round2(maxDd / stakeDenom) : null,
      minTradable,
      minTradablePct: start ? round2((minTradable / start) * 100) : 0,
      tradedToEnd: stopAt == null,
      stopAt,
      afterStop: stopAt == null ? 0 : rows.length - stopAt + 1,
      executed: opened.length,
      totalTrades: rows.length,
      winRate: opened.length ? round2((wins / opened.length) * 100) : null,
      profitFactor: grossLoss < 0 ? round2(grossProfit / Math.abs(grossLoss)) : null,
      skips,
      skipsByPair: [...pairMap.values()],
      retained: sumProfit ? round2((sumNet / sumProfit) * 100) : null,
      avgStakeReal: round2(avgStake),
    },
    trades: rows,
  };
}

export function readParentStake(parent) {
  const params = parent?.params || {};
  const capital = Number(params.startingCapital) || 0;
  const mode = params.stakeMode === "relative" ? "percent" : "fixed";
  const raw = Number(params.stakeValue);
  const value = raw > 0 ? raw : mode === "percent" ? 10 : 1000;
  const reservePct = params.profitReserving == null || params.profitReserving === ""
    ? 0
    : Number(params.profitReserving);
  const leverage = params.mode === "spot" ? 1 : Number(params.leverage) || 1;
  return {
    capital: capital > 0 ? capital : 10000,
    mode,
    value,
    reservePct,
    leverage,
    stoploss: Number(params.stoploss) || 0,
    trades: Math.max(1, Number(parent?.result?.core?.trades) || 12),
    targetPnl: Number(parent?.result?.core?.pnl) || 0,
    pair: params.pair || "BTC/USDT",
    timeframe: params.timeframe || "",
    periodFrom: params.periodFrom || "2024-01-01",
    id: parent?.id || "run",
  };
}

/** When the user switches mode, pick the value whose first trade matches the backtest stake. */
export function defaultValueForMode(info, mode) {
  if (mode === info.mode) return info.value;
  if (mode === "percent") {
    const stake = info.mode === "fixed" ? info.value : (info.capital * info.value) / 100;
    return info.capital ? round2((stake / info.capital) * 100) : 0;
  }
  const rel = info.mode === "percent" ? info.value : (info.value / info.capital) * 100;
  return round2((info.capital * rel) / 100);
}

function craftTrade({
  id, pair, openRate, closeRate, leverage, stake, limits, isShort = false, openDate, closeDate, feeRate = FEE_RATE,
}) {
  const amount = floorToStep((stake * leverage) / openRate, amountStep(limits));
  const stakeAmount = round2((amount * openRate) / leverage);
  const sign = isShort ? -1 : 1;
  const gross = round2(amount * (closeRate - openRate) * sign);
  const feeOpenCost = round2(-amount * openRate * feeRate);
  const feeCloseCost = round2(-amount * closeRate * feeRate);
  const profitAbs = round2(gross + feeOpenCost + feeCloseCost);
  return {
    id,
    pair,
    openDate,
    closeDate,
    openRate,
    closeRate,
    isShort,
    leverage,
    amount,
    stakeAmount,
    profitAbs,
    feeOpenCost,
    feeCloseCost,
    fundingFees: 0,
    exitReason: "roi",
    onCloseTradable: null,
    onCloseTotalBalance: null,
  };
}

function openPrice(pair, stake, leverage, stoploss, rnd) {
  const limits = pairLimits(pair);
  const factor = (1 + Math.abs(stoploss)) / (leverage || 1);
  const lot = amountStep(limits);
  const maxForLot = lot > 0 ? (stake * leverage) / lot : limits.refPrice;
  const maxForAmount = limits.minAmount > 0 ? stake / (limits.minAmount * factor) : limits.refPrice;
  const cap = Math.min(maxForLot, maxForAmount) * 0.85;
  let price = limits.refPrice * (0.92 + rnd() * 0.16);
  const capped = price > cap;
  if (capped) price = cap;
  if (!(price > 0)) price = Math.max(limits.refPrice * 0.01, 0.01);
  const rounded = price >= 1 ? round2(price) : Number(price.toFixed(6));
  return { price: rounded || price, capped };
}

function solveClose(openRate, amount, sign, fee, desiredNet) {
  const denom = amount * (sign - fee);
  if (!(amount > 0) || Math.abs(denom) < 1e-12) return openRate;
  const close = (desiredNet + amount * openRate * (sign + fee)) / denom;
  return close > 0 ? close : openRate * 0.5;
}

/**
 * Deterministic closed-trade tape whose replay at the backtest stake
 * sums to the reported P&L. Two pairs, so a small stake can skip the expensive one.
 */
export function buildParentTape(parent) {
  const info = readParentStake(parent);
  const rnd = mulberry32(hashString(`stress|${info.id}|${info.trades}|${info.targetPnl}|${info.value}`));
  const primary = canonicalPair(info.pair);
  const secondary = primary === CHEAP_PAIR ? "BTC/USDT" : CHEAP_PAIR;
  const n = info.trades;
  const startIso = new Date(`${String(info.periodFrom).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(startIso.getTime())) startIso.setTime(Date.parse("2024-01-01T00:00:00.000Z"));

  const approxStake = info.mode === "fixed"
    ? info.value
    : info.capital * TRADABLE_BALANCE_RATIO * (info.value / 100);
  const fitStake = Math.max(approxStake, 1);

  const prices = [];
  const longs = [];
  let anyCapped = false;
  for (let i = 0; i < n; i += 1) {
    const pair = i % 3 === 2 ? secondary : primary;
    const picked = openPrice(pair, fitStake, info.leverage, info.stoploss, rnd);
    prices.push(picked.price);
    if (picked.capped) anyCapped = true;
    longs.push(rnd() > 0.38);
  }
  if (n > 1) longs[0] = false;

  const rates = longs.map((win, i) => {
    const mag = 0.004 + ((i * 17) % 13) / 1000;
    return win ? mag : -mag;
  });
  // A deep first loss lets a stake near the balance stop. Skip it when the
  // open was already cut down to the pair minimum — that loss would skip the backtest itself.
  if (n > 1 && !anyCapped) rates[0] = -0.12;

  const limits = limitsForPairs([primary, secondary]);
  const simConfig = {
    start: info.capital,
    reservePct: info.reservePct,
    tradableRatio: TRADABLE_BALANCE_RATIO,
    stoploss: info.stoploss,
    mode: info.mode,
    value: info.value,
    limits,
  };

  function assemble(scale) {
    const trades = [];
    let tradable = info.capital;
    for (let i = 0; i < n; i += 1) {
      const pair = i % 3 === 2 ? secondary : primary;
      const openAt = new Date(startIso.getTime() + i * 6 * 3600 * 1000);
      const closeAt = new Date(openAt.getTime() + 2 * 3600 * 1000);
      const aimed = targetStake({
        mode: info.mode,
        value: info.value,
        free: tradable,
        tradableRatio: TRADABLE_BALANCE_RATIO,
        openCount: 0,
      });
      const stake = Math.min(aimed.stake, limits[pair].maxStake);
      const openRate = prices[i];
      const amount = floorToStep((stake * info.leverage) / openRate, amountStep(limits[pair]));
      const stakeReal = amount > 0 ? (amount * openRate) / info.leverage : 0;
      const sign = longs[i] ? 1 : -1;
      const desired = i === 0 && n > 1
        ? stakeReal * rates[0]
        : stakeReal * rates[i] * scale;
      const closeRate = amount > 0
        ? solveClose(openRate, amount, sign, FEE_RATE, desired)
        : openRate;
      const trade = craftTrade({
        id: `t-${i + 1}`,
        pair,
        openRate,
        closeRate,
        leverage: info.leverage,
        stake,
        limits: limits[pair],
        isShort: !longs[i],
        openDate: openAt.toISOString(),
        closeDate: closeAt.toISOString(),
      });
      trades.push(trade);
      const reserve = trade.profitAbs > 0 ? round2((info.reservePct / 100) * trade.profitAbs) : 0;
      tradable = round2(tradable + trade.profitAbs - reserve);
    }
    return trades;
  }

  let scale = 1;
  let best = assemble(scale);
  for (let step = 0; step < 6; step += 1) {
    const pnl = simulateStakeStress(best, simConfig).summary.pnl;
    if (Math.abs(pnl - info.targetPnl) < 0.05) break;
    const first = best[0]?.profitAbs || 0;
    const rest = pnl - first;
    if (Math.abs(rest) < 0.05) break;
    scale *= (info.targetPnl - first) / rest;
    if (!Number.isFinite(scale) || scale === 0) break;
    best = assemble(scale);
  }

  const stamped = simulateStakeStress(best, simConfig);
  best = best.map((trade, index) => {
    const row = stamped.trades[index];
    if (!row || row.status !== "opened") return trade;
    return {
      ...trade,
      amount: row.amountNew,
      stakeAmount: row.stakeReal,
      profitAbs: row.net,
      feeOpenCost: row.feeIn ?? trade.feeOpenCost,
      feeCloseCost: row.feeOut ?? trade.feeCloseCost,
      fundingFees: row.funding ?? 0,
      onCloseTradable: row.tradableAfter,
      onCloseTotalBalance: row.totalAfter,
    };
  });

  return { trades: best, limits, info };
}

export function runStakeOnParent(parent, config) {
  const tape = buildParentTape(parent);
  const info = tape.info;
  return simulateStakeStress(tape.trades, {
    start: info.capital,
    reservePct: info.reservePct,
    tradableRatio: TRADABLE_BALANCE_RATIO,
    stoploss: info.stoploss,
    mode: config.mode,
    value: config.value,
    limits: tape.limits,
  });
}

export const COMPARE_METRICS = [
  { key: "total", label: "Total", expect: "none", format: "money" },
  { key: "pnl", label: "PnL", expect: "scale", format: "money" },
  { key: "roi", label: "ROI", expect: "scale", format: "pct" },
  { key: "maxDdUsdt", label: "Max DD", expect: "scale", format: "money" },
  { key: "maxDdPct", label: "Max drawdown", expect: "scale", format: "pct" },
  { key: "pnlPerStake", label: "PnL per unit of stake", expect: "flat", format: "num" },
  { key: "ddInStakes", label: "Drawdown in stakes", expect: "flat", format: "num" },
  { key: "minTradable", label: "Lowest tradable balance", expect: "none", format: "money" },
  { key: "executed", label: "Executed trades", expect: "flat", format: "count" },
  { key: "winRate", label: "Win rate", expect: "flat", format: "pct" },
  { key: "profitFactor", label: "Profit factor", expect: "flat", format: "num" },
  { key: "retained", label: "PnL of backtest retained", expect: "scale", format: "pct" },
];

/** Old runs have no batchId and stay a batch of one. */
export function stressBatchKey(run) {
  return run?.batchId || run?.id || "";
}

/** One row per launch. Runs inside a batch stay in the order they were added. */
export function groupStressBatches(runs = []) {
  const groups = new Map();
  for (const run of runs) {
    const key = stressBatchKey(run);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(run);
    else groups.set(key, [run]);
  }
  return [...groups.values()]
    .map((items) => {
      const sorted = items.slice().sort(
        (a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)),
      );
      return {
        id: stressBatchKey(sorted[0]),
        runs: sorted,
        createdAt: sorted[sorted.length - 1]?.createdAt || sorted[0]?.createdAt || "",
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || String(b.id).localeCompare(String(a.id)));
}

export function stakeShareOf(summary, baseline) {
  if (!summary || !baseline) return null;
  if (summary.mode === "fixed" && baseline.mode === "fixed" && baseline.value > 0) {
    return summary.value / baseline.value;
  }
  if (baseline.avgStakeReal > 0 && summary.avgStakeReal > 0) {
    return summary.avgStakeReal / baseline.avgStakeReal;
  }
  return null;
}

function diverges(expect, ratio, stakeShare) {
  if (ratio == null || !Number.isFinite(ratio)) return false;
  const target = expect === "scale" ? stakeShare : expect === "flat" ? 1 : null;
  if (target == null || !Number.isFinite(target)) return false;
  const denom = Math.max(Math.abs(target), 0.05);
  return Math.abs(ratio - target) / denom > 0.08;
}

/** Cell tone: warn when the metric ratio leaves the stake share, bad when the run stopped. */
export function compareCells(summary, baseline) {
  const share = stakeShareOf(summary, baseline);
  const stopped = summary?.tradedToEnd === false;
  return COMPARE_METRICS.map((metric) => {
    const value = summary?.[metric.key];
    const base = baseline?.[metric.key];
    const delta = value == null || base == null ? null : round2(value - base);
    const ratio = value == null || base == null || Math.abs(base) < 1e-9 ? null : value / base;
    let tone = "ok";
    if (baseline && summary !== baseline && diverges(metric.expect, ratio, share)) {
      tone = stopped ? "bad" : "warn";
    }
    return { ...metric, value, delta, ratio, tone };
  });
}
