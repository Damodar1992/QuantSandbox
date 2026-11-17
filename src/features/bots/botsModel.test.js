import { describe, expect, it } from "vitest";
import {
  INITIAL_BOTS,
  INITIAL_EXCHANGE_ACCOUNTS,
  findLivePairConflict,
  getBotRuntimeAvailability,
  getCompatibleAccounts,
  validateBotLaunch,
} from "./botsModel";

const source = INITIAL_BOTS[0].source;
const base = {
  source,
  mode: "Dryrun",
  name: "BTC demo",
  capital: 1000,
  accountId: "",
  accounts: INITIAL_EXCHANGE_ACCOUNTS,
  owner: "bogdan",
};

describe("bot launch rules", () => {
  it("allows Dryrun without an exchange account", () => {
    expect(validateBotLaunch(base)).toBeNull();
  });

  it("requires a compatible Live account and does not read its balance", () => {
    expect(validateBotLaunch({ ...base, mode: "Live" })).toBe("Select an exchange account.");
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-bybit" })).toBe("Select a compatible exchange account.");
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-binance", capital: 4000 })).toBeNull();
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-binance" })).toBeNull();
  });

  it("requires a backtest source and at least one stake", () => {
    expect(validateBotLaunch({ ...base, source: null })).toContain("successful backtest");
    expect(validateBotLaunch({ ...base, source: { ...source, backtestStatus: "failed" } })).toContain("successful backtest");
    expect(validateBotLaunch({ ...base, capital: 100 })).toContain("stake amount");
  });

  it("uses percent sizing for relative stakes and fixes the launch position limit at one", () => {
    const relative = { ...source, params: { ...source.params, stakeMode: "relative", stakeValue: 10 } };
    expect(validateBotLaunch({ ...base, source: relative, capital: 50 })).toBeNull();
    expect(validateBotLaunch({ ...base, maxOpenTrades: 0 })).toContain("fixed at 1");
    expect(validateBotLaunch({ ...base, maxOpenTrades: 2 })).toContain("fixed at 1");
    expect(validateBotLaunch({ ...base, stakeMode: "relative", stakeValue: 25, capital: 50 })).toBeNull();
    expect(validateBotLaunch({ ...base, stakeMode: "fixed", stakeValue: 1100 })).toContain("stake amount");
  });

  it("accepts a compatible Dryrun account solely as an optional fee source", () => {
    expect(validateBotLaunch({ ...base, accountId: "acc-binance" })).toBeNull();
    expect(validateBotLaunch({ ...base, accountId: "acc-bybit" })).toContain("compatible fee account");
  });

  it("filters accounts by owner, exchange and market", () => {
    expect(getCompatibleAccounts(source, INITIAL_EXCHANGE_ACCOUNTS, "bogdan").map((account) => account.id)).toEqual(["acc-binance"]);
    expect(getCompatibleAccounts(source, INITIAL_EXCHANGE_ACCOUNTS, "anna")).toEqual([]);
  });
});

describe("Live pair occupancy", () => {
  it("blocks the same account and pair while a bot is active or has exposure", () => {
    const target = { id: "new", mode: "Live", accountId: "acc-binance", status: "Ready for start", source };
    const running = { ...target, id: "running", status: "Running" };
    expect(findLivePairConflict([running], target)?.id).toBe("running");
    expect(findLivePairConflict([{ ...running, status: "Stopped", positions: [{ id: "open" }] }], target)?.id).toBe("running");
    expect(findLivePairConflict([{ ...running, status: "Stopped", positions: [], orders: [] }], target)).toBeNull();
    expect(findLivePairConflict([{ ...running, source: { ...source, params: { ...source.params, pair: "ETH/USDT" } } }], target)).toBeNull();
    expect(findLivePairConflict([{ ...running, accountId: "other" }], target)).toBeNull();
  });
});

describe("runtime availability", () => {
  const asOf = Date.parse("2026-11-10T12:00:00.000Z");
  it("uses runtime contact independently of lifecycle and market data", () => {
    const fresh = { status: "Paused", lastHeartbeatAt: "2026-11-10T11:59:30.000Z", marketSnapshotAt: "2026-10-01T00:00:00.000Z" };
    expect(getBotRuntimeAvailability(fresh, asOf)).toBe("Online");
    expect(getBotRuntimeAvailability({ ...fresh, status: "Running", lastHeartbeatAt: "2026-11-10T11:58:00.000Z", updatedAt: "2026-11-10T12:00:00.000Z" }, asOf)).toBe("Offline");
    expect(getBotRuntimeAvailability({ ...fresh, status: "Stopped" }, asOf)).toBe("Offline");
    expect(getBotRuntimeAvailability({ ...fresh, status: "Ready for start" }, asOf)).toBe("Offline");
    expect(getBotRuntimeAvailability({ ...fresh, status: "Starting", lastHeartbeatAt: null }, asOf)).toBe("Offline");
  });
});
