import { describe, expect, it } from "vitest";
import {
  SKIP,
  buildParentTape,
  groupStressBatches,
  moneyOnAmount,
  round2,
  runStakeOnParent,
  simulateStakeStress,
  targetStake,
} from "./stakeStress";

const BTC = {
  lotStep: 0.001,
  contractSize: 0.001,
  minAmount: 0.001,
  minNotional: 5,
  maxStake: 1_000_000,
  refPrice: 60000,
};

const DOGE = {
  lotStep: 1,
  contractSize: 1,
  minAmount: 1,
  minNotional: 1,
  maxStake: 250_000,
  refPrice: 0.15,
};

function trade(partial) {
  return {
    id: "t-1",
    pair: "BTC/USDT",
    openDate: "2024-01-01T00:00:00.000Z",
    closeDate: "2024-01-01T02:00:00.000Z",
    openRate: 60000,
    closeRate: 61800,
    isShort: false,
    leverage: 2,
    amount: 0.033,
    stakeAmount: 990,
    profitAbs: 57.39,
    feeOpenCost: -0.99,
    feeCloseCost: -1.02,
    fundingFees: 0,
    ...partial,
  };
}

describe("path 2 money", () => {
  it("rebuilds the spec example at 1000 and at 500", () => {
    const sample = trade();
    const full = simulateStakeStress([sample], {
      start: 10000,
      reservePct: 20,
      mode: "fixed",
      value: 1000,
      limits: { "BTC/USDT": BTC },
    });
    const row = full.trades[0];
    expect(row.status).toBe("opened");
    expect(row.amountNew).toBe(0.033);
    expect(row.stakeReal).toBe(990);
    expect(row.gross).toBe(59.4);
    expect(row.feeIn).toBe(-0.99);
    expect(row.feeOut).toBe(-1.02);
    expect(row.net).toBe(57.39);
    expect(row.reserve).toBe(11.48);
    expect(row.tradableAfter).toBe(10045.91);

    const half = simulateStakeStress([sample], {
      start: 10000,
      reservePct: 20,
      mode: "fixed",
      value: 500,
      limits: { "BTC/USDT": BTC },
    });
    expect(half.trades[0].amountNew).toBe(0.016);
    expect(half.trades[0].stakeReal).toBe(480);
    expect(half.trades[0].net).toBe(27.83);
    expect(half.summary.executed).toBe(1);
    expect(half.summary.tradedToEnd).toBe(true);
    expect(half.summary.winRate).toBe(100);
    expect(half.summary.profitFactor).toBeNull();
  });

  it("uses the coefficient when the recorded parts do not match profit_abs", () => {
    const sample = trade({ profitAbs: 80, stakeAmount: 990 });
    const parts = moneyOnAmount(sample, 0.016, 480);
    expect(parts.byCoefficient).toBe(true);
    expect(parts.net).toBe(round2((80 / 990) * 480));
  });
});

describe("skips and stake modes", () => {
  it("stops a fixed stake once free balance stays below it", () => {
    const limits = {
      "BTC/USDT": { ...BTC, lotStep: 0.01, contractSize: 0.01, minAmount: 0.01, minNotional: 1, refPrice: 100 },
    };
    const loss = trade({
      id: "t-1",
      openRate: 100,
      closeRate: 80,
      leverage: 1,
      amount: 90,
      stakeAmount: 9000,
      feeOpenCost: -4.5,
      feeCloseCost: -3.6,
      profitAbs: -1808.1,
    });
    const later = trade({
      id: "t-2",
      openDate: "2024-01-02T00:00:00.000Z",
      closeDate: "2024-01-02T02:00:00.000Z",
      openRate: 100,
      closeRate: 110,
      leverage: 1,
      amount: 10,
      stakeAmount: 1000,
      profitAbs: 90,
      feeOpenCost: -0.5,
      feeCloseCost: -0.55,
    });
    const run = simulateStakeStress([loss, later, { ...later, id: "t-3", openDate: "2024-01-03T00:00:00.000Z", closeDate: "2024-01-03T02:00:00.000Z" }], {
      start: 10000,
      reservePct: 0,
      mode: "fixed",
      value: 9000,
      limits,
    });
    expect(run.trades[0].status).toBe("opened");
    expect(run.trades[1].status).toBe(SKIP.NO_MONEY);
    expect(run.trades[2].status).toBe(SKIP.NO_MONEY);
    expect(run.summary.tradedToEnd).toBe(false);
    expect(run.summary.stopAt).toBe(2);
    expect(run.summary.afterStop).toBe(2);
  });

  it("skips the expensive pair and still opens the cheap one", () => {
    const expensive = trade({
      id: "t-btc",
      pair: "BTC/USDT",
      openRate: 90000,
      closeRate: 91000,
      leverage: 1,
      amount: 0.001,
      stakeAmount: 90,
      profitAbs: 1,
      feeOpenCost: -0.05,
      feeCloseCost: -0.05,
    });
    const cheap = trade({
      id: "t-doge",
      pair: "DOGE/USDT",
      openDate: "2024-01-02T00:00:00.000Z",
      closeDate: "2024-01-02T02:00:00.000Z",
      openRate: 0.15,
      closeRate: 0.16,
      leverage: 1,
      amount: 1000,
      stakeAmount: 150,
      profitAbs: 8,
      feeOpenCost: -0.08,
      feeCloseCost: -0.08,
    });
    const run = simulateStakeStress([expensive, cheap], {
      start: 10000,
      reservePct: 0,
      mode: "fixed",
      value: 20,
      limits: { "BTC/USDT": BTC, "DOGE/USDT": DOGE },
    });
    expect(run.trades[0].status).toBe(SKIP.BELOW_MIN);
    expect(run.trades[1].status).toBe("opened");
    expect(run.summary.tradedToEnd).toBe(true);
    expect(run.summary.skipsByPair.find((row) => row.pair === "BTC/USDT").skipped).toBe(1);
    expect(run.summary.skips.below_min).toBe(1);
  });

  it("changes the percent stake after the balance moves", () => {
    const first = trade({
      id: "t-1",
      pair: "DOGE/USDT",
      openRate: 0.15,
      closeRate: 0.18,
      leverage: 1,
      amount: 6600,
      stakeAmount: 990,
      profitAbs: 180,
      feeOpenCost: -0.5,
      feeCloseCost: -0.6,
    });
    const second = trade({
      ...first,
      id: "t-2",
      openDate: "2024-01-02T00:00:00.000Z",
      closeDate: "2024-01-02T02:00:00.000Z",
    });
    const aimed = targetStake({ mode: "percent", value: 10, free: 10000, openCount: 0 });
    expect(aimed.stake).toBeCloseTo(990, 5);
    const run = simulateStakeStress([first, second], {
      start: 10000,
      reservePct: 0,
      mode: "percent",
      value: 10,
      limits: { "DOGE/USDT": DOGE },
    });
    expect(run.trades[0].status).toBe("opened");
    expect(run.trades[1].status).toBe("opened");
    expect(run.trades[0].targetStake).toBeCloseTo(990, 0);
    expect(run.trades[1].targetStake).toBeGreaterThan(run.trades[0].targetStake);
  });
});

describe("parent tape", () => {
  const parent = {
    id: "oos-test",
    params: {
      startingCapital: 10000,
      stakeMode: "fixed",
      stakeValue: 1000,
      profitReserving: 20,
      mode: "futures",
      leverage: 2,
      pair: "BTC/USDT",
      timeframe: "1h",
      periodFrom: "2024-01-01",
    },
    result: { core: { trades: 24, pnl: 250 } },
  };

  it("replays the backtest stake as the tape, including balances", () => {
    const tape = buildParentTape(parent);
    const run = simulateStakeStress(tape.trades, {
      start: tape.info.capital,
      reservePct: tape.info.reservePct,
      mode: tape.info.mode,
      value: tape.info.value,
      limits: tape.limits,
    });
    expect(run.summary.executed).toBe(tape.trades.length);
    expect(run.summary.pnl).toBeCloseTo(250, 0);
    run.trades.forEach((row, index) => {
      const source = tape.trades[index];
      expect(row.stakeReal).toBeCloseTo(source.stakeAmount, 2);
      expect(row.tradableAfter).toBeCloseTo(source.onCloseTradable, 2);
      expect(row.totalAfter).toBeCloseTo(source.onCloseTotalBalance, 2);
      expect(row.byCoefficient).toBe(false);
    });
  });

  it("stops a stake that no longer fits after the first loss", () => {
    const heavy = runStakeOnParent(parent, { mode: "fixed", value: 9000 });
    expect(heavy.summary.tradedToEnd).toBe(false);
    expect(heavy.summary.skips.no_money).toBeGreaterThan(0);
    expect(heavy.trades[0].status).toBe("opened");
  });

  it("keeps a half stake fully filled and close to half the P&L", () => {
    const base = runStakeOnParent(parent, { mode: "fixed", value: 1000 });
    const half = runStakeOnParent(parent, { mode: "fixed", value: 500 });
    expect(half.summary.executed).toBe(base.summary.totalTrades);
    expect(half.summary.tradedToEnd).toBe(true);
    expect(half.summary.skips.no_money).toBe(0);
    expect(Math.abs(half.summary.pnl / base.summary.pnl - 0.5)).toBeLessThan(0.08);
    expect(half.summary.winRate).toBe(base.summary.winRate);
  });
});

describe("stress batches", () => {
  it("keeps a run without batchId on its own and orders a shared batch by time", () => {
    const batches = groupStressBatches([
      { id: "a", createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "b", batchId: "batch", createdAt: "2024-02-01T00:00:02.000Z" },
      { id: "c", batchId: "batch", createdAt: "2024-02-01T00:00:01.000Z" },
    ]);
    expect(batches.map((batch) => batch.id)).toEqual(["batch", "a"]);
    expect(batches[0].runs.map((run) => run.id)).toEqual(["c", "b"]);
  });
});
