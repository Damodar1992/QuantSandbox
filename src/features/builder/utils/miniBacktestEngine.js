/**
 * Mini Backtest calculation engine (POC v5).
 * Pure functions — no UI, no side effects.
 */

import { median } from "./miniBacktestData";

/**
 * Normalize UI / legacy params into engine config.
 */
export function normalizeMiniBacktestParams(params = {}) {
  const initialBalance = params.initialBalance ?? 10000;
  const stopoutMode = params.stopoutMode ?? "pct";
  const stopVal = params.stopout ?? 0;
  const stopout =
    stopVal <= 0
      ? 0
      : stopoutMode === "pct"
        ? initialBalance * (stopVal / 100)
        : stopVal;

  const orderType = params.orderType ?? "taker";
  const feeTaker = (params.feeTaker ?? params.fees ?? 0.1) / 100;
  const feeMaker = (params.feeMaker ?? (params.fees != null ? params.fees * 0.5 : 0.05)) / 100;
  const fee = orderType === "maker" ? feeMaker : feeTaker;
  const slippage = orderType === "maker" ? 0 : Math.max(0, (params.slippage ?? 0.05) / 100);

  const marketType = params.marketType ?? "spot";
  const futures = marketType === "futures";
  const leverage = futures ? Math.max(1, params.leverage ?? 5) : 1;

  const stakeMode = params.stakeMode ?? (params.fixedStakeAmount > 0 ? "fixed" : "relative");

  return {
    initialBalance,
    startBal: initialBalance,
    stakeMode,
    mode: stakeMode,
    fixedStakeAmount: params.fixedStakeAmount ?? params.fixedStake ?? 100,
    relativeStakeAmount: params.relativeStakeAmount ?? params.relativeStake ?? 10,
    stakeAmt: params.fixedStakeAmount ?? params.fixedStake ?? 100,
    stakePct: (params.relativeStakeAmount ?? params.relativeStake ?? 10) / 100,
    reservedPct: params.reservedPct ?? 0,
    orderType,
    feeTaker,
    feeMaker,
    fee,
    slippage,
    marketType,
    futures,
    leverage,
    maintMargin: (params.maintMargin ?? 0.5) / 100,
    fundRate: (params.fundRate ?? 0.01) / 100,
    stopoutMode,
    stopout,
    stopVal,
    cycleCount: params.cycleCount ?? params.maxCycles ?? 50,
    maxCycles: params.cycleCount ?? params.maxCycles ?? 50,
  };
}

/**
 * BEFORE — epoch (theoretical) metrics from raw cycle OHLC paths.
 */
export function epochMetrics(cycles, meta = {}) {
  const N = cycles.length;
  if (!N) {
    return {
      N: 0,
      hitRate: 0,
      medMFE: 0,
      medMAE: 0,
      medAIR: 0,
      medReturn: 0,
      medDurC: 0,
      avgDurC: 0,
      pfOHLC: null,
      profitCapture: null,
      medTtMfe: null,
      medTtMae: null,
      cagr: null,
      calmar: null,
      roiOHLC: 0,
      maxDD: 0,
    };
  }

  const ret = cycles.map((c) => c.P_exit / c.P0 - 1);
  const mfe = cycles.map((c) => c.mfe_pct / 100);
  const mae = cycles.map((c) => c.mae_pct / 100);
  const air = cycles.map((c) =>
    Math.min(c.mfe_pct / Math.max(Math.abs(c.mae_pct), 1e-9), 10),
  );
  const durations = cycles.map((c) => c.duration_candles);
  const hits = cycles.filter((c) => c.P_exit > c.P0).length;
  const gp = ret.filter((r) => r > 0).reduce((a, b) => a + b, 0);
  const gl = Math.abs(ret.filter((r) => r < 0).reduce((a, b) => a + b, 0));
  const pcv = [];
  for (const c of cycles) {
    const r = c.P_exit / c.P0 - 1;
    const m = c.mfe_pct / 100;
    if (m <= 0) continue;
    pcv.push(r <= 0 ? 0 : r / m);
  }
  const tMfe = cycles.map((c) => c.idx_mfe - 1);
  const tMae = cycles.map((c) => c.idx_mae - 1);

  const tfHours = meta.tfHours ?? 1;
  const epochDays = cycles.reduce((a, c) => a + c.duration_candles, 0) * (tfHours / 24);

  let equity = 1;
  let peak = 1;
  let maxDD = 0;
  for (const r of ret) {
    equity *= 1 + r;
    if (equity > peak) peak = equity;
    if (peak > 0) maxDD = Math.max(maxDD, (peak - equity) / peak);
  }

  let cagr = null;
  let calmar = null;
  if (epochDays > 0 && equity > 0) {
    const annual = Math.pow(equity, 365 / epochDays) - 1;
    cagr = annual * 100;
    calmar =
      maxDD > 0 ? annual / maxDD : annual > 0 ? Infinity : annual < 0 ? -Infinity : null;
  }

  return {
    N,
    hitRate: (hits / N) * 100,
    medMFE: median(mfe) * 100,
    medMAE: median(mae) * 100,
    medAIR: median(air),
    medReturn: median(ret) * 100,
    medDurC: median(durations),
    avgDurC: cycles.reduce((a, c) => a + c.duration_candles, 0) / N,
    pfOHLC: gl > 0 ? gp / gl : gp > 0 ? Infinity : null,
    profitCapture: median(pcv),
    medTtMfe: median(tMfe),
    medTtMae: median(tMae),
    cagr: cagr != null ? +cagr.toFixed(2) : null,
    calmar:
      calmar === Infinity || calmar === -Infinity || calmar == null
        ? calmar
        : +calmar.toFixed(2),
    roiOHLC: +((equity - 1) * 100).toFixed(2),
    maxDD: +(maxDD * 100).toFixed(2),
  };
}

/**
 * AFTER — mini backtest replay with reserve, fees, futures, stopout.
 * @param {Array} cycles - POC cycle contract
 * @param {Object} params - UI params
 * @param {Object} meta - { tfHours, pair?, timeframe? }
 */
export function runMiniBacktest(cycles, params, meta = {}) {
  const cfg = normalizeMiniBacktestParams(params);
  const tfHours = meta.tfHours ?? 1;
  const L = cfg.futures ? Math.max(1, cfg.leverage) : 1;

  let tradable = cfg.startBal;
  let reserve = 0;
  let peakBal = cfg.startBal;
  let maxDD = 0;
  let maxDDIntra = 0;
  let peakTrad = cfg.startBal;
  let maxDDTrad = 0;
  let maxDDTradIntra = 0;

  const rows = [];
  let halted = false;
  let haltAt = null;
  let haltReason = null;
  let haltIdx = null;

  const maxCycles = Math.min(cycles.length, cfg.maxCycles);

  for (let ci = 0; ci < maxCycles; ci++) {
    const c = cycles[ci];

    if (cfg.stopout > 0 && tradable <= cfg.stopout) {
      halted = true;
      haltAt = c.id;
      haltIdx = ci;
      haltReason = "stopout";
      rows.push({ c, status: "halt", tradable, reserve, equity: tradable + reserve });
      break;
    }

    const available = tradable;
    let stake =
      cfg.mode === "fixed"
        ? Math.min(cfg.stakeAmt, available)
        : available * cfg.stakePct;

    if (stake <= 0) {
      rows.push({ c, status: "skip", tradable, reserve, equity: tradable + reserve });
      continue;
    }

    const notional = stake * L;
    const balBefore = tradable + reserve;
    const durH = c.duration_candles * tfHours;
    const maeFrac = c.mae_pct / 100;
    const entryFill = c.P0 * (1 + cfg.slippage);
    const exitFill = c.P_exit * (1 - cfg.slippage);
    const roiRaw = exitFill / entryFill - 1;
    const entryFee = notional * cfg.fee;
    const liqFrac = -(1 / L - cfg.maintMargin);
    const liquidated = cfg.futures && L > 1 && maeFrac <= liqFrac;

    let gross;
    let exitFee;
    let funding;
    let slipCost;

    if (liquidated) {
      gross = -stake;
      exitFee = 0;
      funding = 0;
      slipCost = 0;
    } else {
      gross = notional * roiRaw;
      exitFee = (notional + gross) * cfg.fee;
      funding = cfg.futures ? notional * cfg.fundRate * Math.floor(durH / 8) : 0;
      slipCost = notional * (c.P_exit / c.P0 - 1) - gross;
    }

    const tradeFees = entryFee + exitFee;
    const net = liquidated ? gross - entryFee : gross - entryFee - exitFee - funding;
    const status = liquidated ? "liq" : net > 0 ? "win" : net < 0 ? "loss" : "be";

    const worstUnreal = liquidated ? -stake : Math.min(0, notional * maeFrac);
    const intraLow = balBefore + worstUnreal - entryFee;
    const ddIntra = peakBal > 0 ? Math.min(1, (peakBal - intraLow) / peakBal) : 1;
    if (ddIntra > maxDDIntra) maxDDIntra = ddIntra;

    const intraLowTrad = tradable + worstUnreal - entryFee;
    const ddTradIntra = peakTrad > 0 ? Math.min(1, (peakTrad - intraLowTrad) / peakTrad) : 1;
    if (ddTradIntra > maxDDTradIntra) maxDDTradIntra = ddTradIntra;

    let skim = 0;
    if (net > 0) {
      skim = net * (cfg.reservedPct / 100);
      reserve += skim;
      tradable += net - skim;
    } else {
      tradable += net;
    }

    let ruin = false;
    if (tradable <= 0) {
      tradable = 0;
      ruin = true;
    }

    const balance = tradable + reserve;
    if (balance > peakBal) peakBal = balance;
    const dd = peakBal > 0 ? Math.min(1, (peakBal - balance) / peakBal) : 1;
    if (dd > maxDD) maxDD = dd;
    if (dd > maxDDIntra) maxDDIntra = dd;

    if (tradable > peakTrad) peakTrad = tradable;
    const ddTrad = peakTrad > 0 ? Math.min(1, (peakTrad - tradable) / peakTrad) : 1;
    if (ddTrad > maxDDTrad) maxDDTrad = ddTrad;
    if (ddTrad > maxDDTradIntra) maxDDTradIntra = ddTrad;

    rows.push({
      c,
      status,
      stake,
      notional,
      roiRaw,
      gross,
      tradeFees,
      entryFee,
      exitFee,
      funding,
      slipCost,
      net,
      skim,
      reserve,
      tradable,
      equity: balance,
      intraLow,
      worstUnreal,
      durH,
      liquidated,
    });

    if (ruin) {
      halted = true;
      haltAt = c.id;
      haltIdx = ci;
      haltReason = "ruin";
      break;
    }
  }

  const exec = rows.filter((r) => ["win", "loss", "be", "liq"].includes(r.status));
  const wins = exec.filter((r) => r.net > 0);
  const losses = exec.filter((r) => r.net < 0);
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const pnlGross = sum(exec, (r) => r.gross);
  const pnlNet = sum(exec, (r) => r.net);
  const tradeFeesT = sum(exec, (r) => r.tradeFees);
  const fundingT = sum(exec, (r) => r.funding);
  const slipCostT = sum(exec, (r) => r.slipCost || 0);
  const liqCount = exec.filter((r) => r.status === "liq").length;

  const pf = (side) => {
    const gp = sum(
      exec.filter((r) => r[side] > 0),
      (r) => r[side],
    );
    const gl = Math.abs(
      sum(
        exec.filter((r) => r[side] < 0),
        (r) => r[side],
      ),
    );
    return gl > 0 ? gp / gl : gp > 0 ? Infinity : null;
  };

  const equity = tradable + reserve;
  const roiTotal = (equity / cfg.startBal - 1) * 100;
  const roiReserve = (reserve / cfg.startBal) * 100;
  const roiTradable = (tradable / cfg.startBal - 1) * 100;
  const epochDays = sum(exec, (r) => r.durH) / 24;

  let calmar = null;
  let annual = null;
  if (epochDays > 0 && equity > 0) {
    annual = Math.pow(equity / cfg.startBal, 365 / epochDays) - 1;
    calmar =
      maxDD > 0 ? annual / maxDD : annual > 0 ? Infinity : annual < 0 ? -Infinity : null;
  }

  const winRate = exec.length ? (wins.length / exec.length) * 100 : 0;
  const pcvE = [];
  for (const r of exec) {
    const m = r.c.mfe_pct / 100;
    if (m <= 0) continue;
    pcvE.push(r.roiRaw <= 0 ? 0 : r.roiRaw / m);
  }
  const avgDurExec = exec.length ? sum(exec, (r) => r.c.duration_candles) / exec.length : 0;

  const trades = rows
    .filter((x) => x.tradable !== undefined && x.status !== "halt" && x.status !== "skip")
    .map((r) => ({
      cycleId: r.c.id,
      tradable: +r.tradable.toFixed(2),
      reserve: +r.reserve.toFixed(2),
      equity: +r.equity.toFixed(2),
      balance: +r.equity.toFixed(2),
      netPnL: +r.net.toFixed(2),
      status: r.status,
    }));

  const summary = {
    initialBalance: cfg.startBal,
    roiTotal: +roiTotal.toFixed(2),
    roiReserve: +roiReserve.toFixed(2),
    roiTradable: +roiTradable.toFixed(2),
    equity: +equity.toFixed(2),
    tradable: +tradable.toFixed(2),
    reserve: +reserve.toFixed(2),
    pnlGross: +pnlGross.toFixed(2),
    pnlNet: +pnlNet.toFixed(2),
    tradeFeesT: +tradeFeesT.toFixed(2),
    fundingT: +fundingT.toFixed(2),
    slipCostT: +slipCostT.toFixed(2),
    liqCount,
    pfNet: pf("net") === Infinity ? Infinity : pf("net") != null ? +pf("net").toFixed(2) : null,
    maxDD: +(maxDD * 100).toFixed(2),
    maxDDIntra: +(maxDDIntra * 100).toFixed(2),
    maxDDTrad: +(maxDDTrad * 100).toFixed(2),
    maxDDTradIntra: +(maxDDTradIntra * 100).toFixed(2),
    calmar: calmar === Infinity || calmar === -Infinity || calmar == null ? calmar : +calmar.toFixed(2),
    annual: annual != null ? +annual.toFixed(4) : null,
    winRate: +winRate.toFixed(1),
    profitCaptureExec: median(pcvE),
    avgDurExec: +avgDurExec.toFixed(1),
    epochDays: +epochDays.toFixed(2),
    execCount: exec.length,
    totalCycles: maxCycles,
    halted,
    haltReason,
    haltAt,
    haltIdx,
  };

  // Legacy aliases for older UI components
  summary.roi = summary.roiTotal;
  summary.finalBalance = summary.equity;
  summary.totalPnL = summary.pnlNet;
  summary.maxDrawdown = summary.maxDDTradIntra;
  summary.profitFactor = summary.pfNet ?? 0;
  summary.stoppedOut = halted;
  summary.cyclesExecuted = exec.length;
  summary.totalFees = summary.tradeFeesT;
  summary.winCount = wins.length;
  summary.lossCount = losses.length;
  summary.totalTrades = exec.length;

  const epoch = epochMetrics(cycles.slice(0, maxCycles), meta);

  return {
    summary,
    epoch,
    rows,
    trades,
    halted,
    haltReason,
    haltAt,
    haltIdx,
    exec,
    meta,
  };
}

/**
 * Simple hash of params object for deduplication.
 */
export function hashParams(params) {
  const keys = Object.keys(params).sort();
  return keys.map((k) => `${k}=${params[k]}`).join("|");
}

/** Fix legacy entries that share the same id (same epoch, different params). */
export function dedupeMiniBacktestResultIds(results) {
  const seen = new Set();
  let changed = false;
  const next = results.map((r) => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      return r;
    }
    changed = true;
    const newId = `${r.id}::${r.paramsHash ?? r.createdAt}`;
    seen.add(newId);
    return { ...r, id: newId };
  });
  return changed ? next : results;
}
