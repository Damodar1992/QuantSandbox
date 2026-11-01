import { describe, expect, it } from "vitest";
import { INITIAL_BOTS, INITIAL_COMPILED_STRATEGIES } from "./botsModel";
import { closedTrades, demoCandles, equityDrawdown, performanceSummary, periodBreakdown, tradesInWindow } from "./botsAnalytics";
import { getBotMetrics } from "./botsDisplay";

describe("fully closed trade period breakdown", () => {
  const trade = (id, openedAt, closedAt, pnl, extra = {}) => ({ id, openedAt, closedAt, pnl, ...extra });
  it("assigns the whole result to final closing UTC day and ignores open positions and partial exit events", () => {
    const bot = { capital: 1000, trades: [
      trade("cross-day", "2026-10-01T10:00:00Z", "2026-10-03T00:30:00Z", 30, { partialExits: [{ at: "2026-10-02T12:00:00Z", pnl: 10 }] }),
      trade("open", "2026-10-01T10:00:00Z", null, 15),
    ], positions: [{ unrealizedPnl: 900 }] };
    expect(closedTrades(bot)).toHaveLength(1);
    expect(periodBreakdown(bot)).toEqual([expect.objectContaining({ at: Date.parse("2026-10-03T00:00:00Z"), trades: 1, pnl: 30, returnPct: 3 })]);
  });
  it("groups Monday weeks across a year boundary and keeps calendar months separate", () => {
    const bot = { capital: 1000, trades: [trade("a", "2026-12-31", "2026-12-31T23:59:00Z", 20), trade("b", "2027-01-01", "2027-01-01T00:01:00Z", -5)] };
    expect(periodBreakdown(bot, "weeks")).toEqual([expect.objectContaining({ at: Date.parse("2026-12-28T00:00:00Z"), pnl: 15, trades: 2 })]);
    expect(periodBreakdown(bot, "months").map((r) => r.pnl)).toEqual([20, -5]);
  });
  it("retains zero activity days, distinguishes missing P&L from zero, and avoids zero-capital division", () => {
    const bot = { capital: 0, trades: [trade("a", "2026-10-01", "2026-10-01", 0), trade("b", "2026-10-03", "2026-10-03", null)] };
    const rows = periodBreakdown(bot);
    expect(rows.map((r) => r.trades)).toEqual([1, 0, 1]);
    expect(rows.map((r) => r.pnl)).toEqual([0, 0, null]);
    expect(rows.every((r) => r.returnPct === null)).toBe(true);
    expect(periodBreakdown({ trades: [] })).toEqual([]);
  });
});

describe("coherent demo analytics", () => {
  it("lists a trade once and includes trades spanning the visible window without either marker", () => {
    const spanning = { id: "spanning", openedAt: "2026-10-01", closedAt: "2026-10-10" };
    const bot = { trades: [spanning, spanning, { id: "outside", openedAt: "2026-10-11", closedAt: "2026-10-12" }], positions: [{ id: "open", openedAt: "2026-10-02" }] };
    expect(tradesInWindow(bot, Date.parse("2026-10-04"), Date.parse("2026-10-05")).map((t) => t.id)).toEqual(["open", "spanning"]);
    expect(tradesInWindow({ trades: [], positions: [] }, 0, 1)).toEqual([]);
  });
  it("reconciles days, weeks, months, history and realized result without including open P&L", () => {
    const bot = INITIAL_BOTS[0];
    for (const period of ["days", "weeks", "months"]) {
      const rows = periodBreakdown(bot, period);
      expect(rows.reduce((sum, r) => sum + r.pnl, 0)).toBeCloseTo(bot.realizedPnl);
      expect(rows.reduce((sum, r) => sum + r.trades, 0)).toBe(bot.closedTradeCount);
    }
    const stats = performanceSummary(bot);
    expect(stats.winRate).toBe(bot.winRate);
    expect(stats.expectancy).toBeCloseTo(32.8 / 8);
    expect(stats.profitFactor).toBeCloseTo(59.6 / 26.8);
  });
  it("calculates drawdown from sampled equity and keeps profit reserve out of available funds", () => {
    const bot = { capital: 1000, realizedPnl: 100, profitReserve: 30, positions: [], startedAt: "2026-01-01", equityHistory: [{ at: "2026-01-01", value: 1000 }, { at: "2026-01-02", value: 1200 }, { at: "2026-01-03", value: 900 }, { at: "2026-01-04", value: 1100 }] };
    expect(equityDrawdown(bot)).toEqual(expect.objectContaining({ maxPct: 25, maxAmount: 300 }));
    expect(equityDrawdown(bot).currentPct).toBeCloseTo(100 / 12);
    expect(getBotMetrics(bot).available).toBe(1070);
    expect(getBotMetrics(bot).equity).toBe(1100);
  });
  it("keeps illustrative markers inside candle ranges and returns empty history for a new bot", () => {
    const candles = demoCandles(INITIAL_BOTS[0], INITIAL_COMPILED_STRATEGIES[0]);
    expect(candles.length).toBeGreaterThan(100);
    expect(candles.every((c) => c.executions.every((e) => e.price >= c.low && e.price <= c.high))).toBe(true);
    expect(demoCandles({ trades: [], positions: [], updatedAt: "2026-11-01" }, INITIAL_COMPILED_STRATEGIES[0])).toEqual([]);
    expect(performanceSummary({ trades: [] }).winRate).toBeNull();
    expect(performanceSummary({ trades: [] }).realized).toBe(0);
    expect(performanceSummary({ trades: [] }).expectancy).toBeNull();
  });
});
