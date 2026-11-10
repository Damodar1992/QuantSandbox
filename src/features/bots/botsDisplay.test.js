import { describe, expect, it } from "vitest";
import { INITIAL_BOTS, INITIAL_COMPILED_STRATEGIES, INITIAL_EXCHANGE_ACCOUNTS } from "./botsModel";
import {
  accountName,
  filterAndSortBots,
  formatOpenAge,
  formatTradeQuantity,
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
    expect(result.balance).toBeCloseTo(1032.8);
    expect(result.available).toBeCloseTo(632.8);
    expect(result.returnPct).toBeCloseTo(4.86);
    expect(result.committed).toBe(400);
  });
  it("distinguishes missing results and position data from genuine zero", () => {
    expect(getBotMetrics({ capital: 1000, realizedPnl: null, positions: [] }).totalPnl).toBeNull();
    expect(getBotMetrics({ capital: 1000, realizedPnl: null, positions: [] }).balance).toBeNull();
    expect(getBotMetrics({ capital: 1000, realizedPnl: 100, profitReserve: 30, positions: [] }).balance).toBe(1100);
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
  it("prefers filled quantity and never infers Futures quantity from margin alone", () => {
    const trade = { pair: "BTC/USDT", stake: 200, entryPrice: 60000 };
    expect(formatTradeQuantity(trade, "spot")).toBe("0.00333333 BTC");
    expect(formatTradeQuantity({ ...trade, quantity: 0.002 }, "spot")).toBe("0.002 BTC");
    expect(formatTradeQuantity({ ...trade, leverage: 3 }, "futures")).toBe("No data");
  });
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

describe("Dryrun fee source", () => {
  it("distinguishes an optional account fee source from exchange fees", () => {
    const bot = INITIAL_BOTS[0];
    expect(accountName({ ...bot, accountId: null }, INITIAL_EXCHANGE_ACCOUNTS)).toContain("exchange fees");
    expect(accountName({ ...bot, accountId: "acc-binance" }, INITIAL_EXCHANGE_ACCOUNTS)).toContain("Binance Main");
  });
});
