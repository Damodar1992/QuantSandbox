import { describe, expect, it } from "vitest";
import { INITIAL_BOTS, INITIAL_COMPILED_STRATEGIES, INITIAL_EXCHANGE_ACCOUNTS, prepareBotRestart } from "./botsModel";
import {
  filterAndSortBots,
  formatOpenAge,
  getBotMetrics,
  money,
  stopLossDistancePct,
  summarizeOrderKinds,
} from "./botsDisplay";

describe("bot result presentation", () => {
  it("keeps total, realized and open P&L consistent with equity and starting capital", () => {
    const result = getBotMetrics(INITIAL_BOTS[0]);
    expect(result.totalPnl).toBeCloseTo(48.6);
    expect(result.equity).toBeCloseTo(1048.6);
    expect(result.available).toBeCloseTo(632.8);
    expect(result.returnPct).toBeCloseTo(4.86);
    expect(result.committed).toBe(400);
  });
  it("distinguishes missing results and position data from genuine zero", () => {
    expect(getBotMetrics({ capital: 1000, realizedPnl: null, positions: [] }).totalPnl).toBeNull();
    expect(getBotMetrics({ capital: 1000, realizedPnl: 0, positions: null }).equity).toBeNull();
    expect(getBotMetrics({ capital: 1000, realizedPnl: 0, positions: [] }).totalPnl).toBe(0);
    expect(money(null)).toBe("No data");
    expect(money(0)).toBe("0.00");
    expect(getBotMetrics({ capital: 0, realizedPnl: 1, positions: [] }).returnPct).toBeNull();
  });
  it("combines account filters and search and does not reorder the source list", () => {
    const filters = { strategy: "All", mode: "All", status: "All", owner: "All", account: "acc-binance" };
    const originalIds = INITIAL_BOTS.map((bot) => bot.id);
    const rows = filterAndSortBots(INITIAL_BOTS, INITIAL_COMPILED_STRATEGIES, INITIAL_EXCHANGE_ACCOUNTS, filters, "btc", "pnl");
    expect(rows.map((bot) => bot.id)).toEqual(["bot-demo-2"]);
    expect(INITIAL_BOTS.map((bot) => bot.id)).toEqual(originalIds);
  });
});

describe("open position helpers", () => {
  it("formats open age from snapshot time", () => {
    expect(formatOpenAge("2026-10-13T11:15:00.000Z", "2026-10-13T12:42:00.000Z")).toBe("1h 27m open");
  });

  it("computes stop-loss distance from mark price", () => {
    expect(
      stopLossDistancePct({
        direction: "Long",
        currentPrice: 63690,
        stopLoss: 58800,
      }),
    ).toBeCloseTo(((63690 - 58800) / 63690) * 100, 5);
  });

  it("summarizes open order kinds", () => {
    expect(summarizeOrderKinds([{ kind: "exit" }, { kind: "add" }])).toBe("Exit · Add");
    expect(summarizeOrderKinds([])).toBe("None");
  });
});

describe("preview restart identity", () => {
  const strategy = INITIAL_COMPILED_STRATEGIES[0];
  it("preserves ID, mode, account, original start, capital and history", () => {
    const source = INITIAL_BOTS[1];
    const { bot } = prepareBotRestart(source, strategy, INITIAL_EXCHANGE_ACCOUNTS, "2026-10-19T12:00:00Z");
    expect(bot.id).toBe(source.id);
    expect(bot.trades).toBe(source.trades);
    expect(bot.startedAt).toBe(source.startedAt);
    expect(bot.capital).toBe(source.capital);
    expect(bot.realizedPnl).toBe(source.realizedPnl);
    expect(bot.accountId).toBe(source.accountId);
    expect(bot.mode).toBe(source.mode);
    expect(bot.status).toBe("Starting");
    expect(source.status).toBe("Stopped");
  });
  it("blocks restart when positions, orders or unavailable connection require reconciliation", () => {
    const source = INITIAL_BOTS[1];
    expect(prepareBotRestart({ ...source, positions: INITIAL_BOTS[0].positions }, strategy, INITIAL_EXCHANGE_ACCOUNTS, "now").error).toContain("reconciliation");
    expect(prepareBotRestart({ ...source, orders: null }, strategy, INITIAL_EXCHANGE_ACCOUNTS, "now").error).toContain("reconciliation");
    expect(prepareBotRestart(source, strategy, [], "now").error).toContain("compatible exchange account");
    expect(prepareBotRestart(INITIAL_BOTS[0], strategy, INITIAL_EXCHANGE_ACCOUNTS, "now").error).toContain("inactive");
  });
});
