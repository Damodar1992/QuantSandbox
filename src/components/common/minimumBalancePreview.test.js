import { describe, expect, it } from "vitest";
import {
  illustrativeLimits,
  minimumOrderUsdt,
  previewBotStart,
  previewMinimumBalance,
  previewPrice,
  PREVIEW_STATUS,
} from "./minimumBalancePreview";

const LIMITS = illustrativeLimits({ exchange: "binance", market: "futures" });

function preview(overrides) {
  return previewMinimumBalance({
    confirmed: true,
    market: "futures",
    exchange: "binance",
    leverage: 2,
    entryFeePct: 0.05,
    limits: LIMITS,
    ...overrides,
  });
}

describe("preview price and minimum order", () => {
  it("applies the config buffer only to the asset price", () => {
    expect(previewPrice(40_000, 10)).toBe(44_000);
  });

  it("rounds the minimum quantity up to the exchange step", () => {
    const order = minimumOrderUsdt(LIMITS);
    expect(order.price).toBe(44_000);
    expect(order.units).toBeCloseTo(0.002, 8);
    expect(order.order).toBeCloseTo(88, 8);
  });

  it("sizes HTX futures in contracts", () => {
    const limits = illustrativeLimits({ exchange: "htx", market: "futures" });
    const order = minimumOrderUsdt(limits);
    expect(limits.contractSize).toBe(0.001);
    expect(order.units).toBe(2);
    expect(order.order).toBeCloseTo(88, 8);
  });
});

describe("section 6 preview outcomes", () => {
  it("is READY for relative 50% with 300 free", () => {
    const result = preview({ stakeMode: "relative", stakeValue: 50, freeBalance: 300 });
    expect(result.status).toBe(PREVIEW_STATUS.READY);
    expect(result.metric).toBe("minimumBalance");
    expect(result.amount).toBe(88);
    expect(result.ready).toBe(true);
  });

  it("blocks relative 50% when free balance is 60", () => {
    const result = preview({ stakeMode: "relative", stakeValue: 50, freeBalance: 60 });
    expect(result.status).toBe(PREVIEW_STATUS.INSUFFICIENT);
    expect(result.amount).toBe(88);
    expect(result.highlight).toBe("balance");
    expect(result.ready).toBe(false);
  });

  it("blocks a fixed stake below the exchange minimum without raising the balance", () => {
    const result = preview({ stakeMode: "fixed", stakeValue: 30, freeBalance: 1000 });
    expect(result.status).toBe(PREVIEW_STATUS.CONFIG_BLOCKED);
    expect(result.metric).toBe("minimumStake");
    expect(result.amount).toBe(44);
    expect(result.highlight).toBe("stake");
  });

  it("includes the entry fee for a fixed stake that meets the minimum order", () => {
    const result = preview({ stakeMode: "fixed", stakeValue: 44, freeBalance: 44 });
    expect(result.status).toBe(PREVIEW_STATUS.INSUFFICIENT);
    expect(result.amount).toBe(44.05);
  });

  it("keeps fixed stake at 100 when leverage is 2x and balance is short by the fee", () => {
    const result = preview({ stakeMode: "fixed", stakeValue: 100, freeBalance: 100 });
    expect(result.status).toBe(PREVIEW_STATUS.INSUFFICIENT);
    expect(result.amount).toBe(100.09);
    expect(result.metric).toBe("minimumBalance");
  });

  it("is READY at the rounded minimum balance while the fixed stake stays 100", () => {
    const short = preview({ stakeMode: "fixed", stakeValue: 100, freeBalance: 100 });
    const ready = preview({ stakeMode: "fixed", stakeValue: 100, freeBalance: 101 });
    expect(ready.status).toBe(PREVIEW_STATUS.READY);
    expect(ready.amount).toBe(100.09);
    const substituted = preview({ stakeMode: "fixed", stakeValue: 100, freeBalance: short.amount });
    expect(substituted.status).toBe(PREVIEW_STATUS.READY);
    expect(substituted.amount).toBe(100.09);
  });

  it("shows a dash when required data is not confirmed", () => {
    const result = preview({ confirmed: false, stakeMode: "fixed", stakeValue: 100, freeBalance: 1000 });
    expect(result.status).toBe(PREVIEW_STATUS.DATA_PAUSED);
    expect(result.amount).toBeNull();
    expect(result.ready).toBe(false);
  });

  it("does not invent a balance when relative stake leaves nothing for the fee", () => {
    const result = preview({ stakeMode: "relative", stakeValue: 100, freeBalance: 10_000 });
    expect(result.status).toBe(PREVIEW_STATUS.INSUFFICIENT);
    expect(result.amount).toBeNull();
    expect(result.hint).toMatch(/Relative Stake/);
    expect(result.highlight).toBe("stake");
  });
});

describe("market rules", () => {
  it("forces spot leverage to 1x", () => {
    const result = preview({
      market: "spot",
      leverage: 5,
      stakeMode: "fixed",
      stakeValue: 30,
      freeBalance: 1000,
    });
    expect(result.status).toBe(PREVIEW_STATUS.CONFIG_BLOCKED);
    expect(result.amount).toBe(88);
  });
});

describe("previewBotStart", () => {
  it("uses the virtual wallet for Dry Run and the shared taker fee", () => {
    const result = previewBotStart({
      bot: { mode: "Dryrun", capital: 1000, stakeMode: "fixed", stakeValue: 200 },
      strategy: { params: { exchange: "binance", mode: "spot", pair: "BTC/USDT", leverage: 1 } },
      account: null,
    });
    expect(result.status).toBe(PREVIEW_STATUS.READY);
    expect(result.metric).toBe("minimumBalance");
    expect(result.amount).toBeGreaterThan(200);
  });

  it("blocks a Dry Run setup when the virtual balance is below the minimum", () => {
    const result = previewBotStart({
      bot: { mode: "Dryrun", capital: 50, stakeMode: "fixed", stakeValue: 100 },
      strategy: { params: { exchange: "binance", mode: "spot", pair: "BTC/USDT", leverage: 1 } },
      account: null,
    });
    expect(result.status).toBe(PREVIEW_STATUS.INSUFFICIENT);
    expect(result.ready).toBe(false);
    expect(result.highlight).toBe("balance");
  });

  it("checks Live against allocated capital, not the exchange balance", () => {
    const result = previewBotStart({
      bot: { mode: "Live", capital: 50_000, stakeMode: "relative", stakeValue: 1 },
      strategy: { params: { exchange: "binance", mode: "spot", pair: "BTC/USDT", leverage: 1 } },
      account: { balance: 3500 },
    });
    expect(result.status).toBe(PREVIEW_STATUS.READY);
    expect(result.amount).toBe(8800);
  });

  it("pauses Live when the account is not selected", () => {
    const result = previewBotStart({
      bot: { mode: "Live", capital: 1000, stakeMode: "fixed", stakeValue: 200 },
      strategy: { params: { exchange: "binance", mode: "spot", pair: "BTC/USDT", leverage: 1 } },
      account: null,
    });
    expect(result.status).toBe(PREVIEW_STATUS.DATA_PAUSED);
    expect(result.amount).toBeNull();
  });
});
