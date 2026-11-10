import { describe, expect, it } from "vitest";
import {
  INITIAL_COMPILED_STRATEGIES,
  INITIAL_EXCHANGE_ACCOUNTS,
  countStrategyBots,
  getBotRuntimeAvailability,
  getCompatibleAccounts,
  validateBotLaunch,
} from "./botsModel";

const strategy = INITIAL_COMPILED_STRATEGIES[0];
const base = {
  strategy,
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

  it("requires a compatible account and sufficient balance for Live", () => {
    expect(validateBotLaunch({ ...base, mode: "Live" })).toBe("Select an exchange account.");
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-bybit" })).toBe("Select a compatible exchange account.");
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-binance", capital: 4000 })).toContain("Available account balance");
    expect(validateBotLaunch({ ...base, mode: "Live", accountId: "acc-binance" })).toBeNull();
  });

  it("does not launch an archived strategy or with less than one stake", () => {
    expect(validateBotLaunch({ ...base, strategy: { ...strategy, status: "Archive" } })).toContain("Restore");
    expect(validateBotLaunch({ ...base, capital: 100 })).toContain("stake amount");
  });

  it("uses percent sizing for relative stakes and fixes the launch position limit at one", () => {
    const relative = { ...strategy, params: { ...strategy.params, stakeMode: "relative", stakeValue: 10 } };
    expect(validateBotLaunch({ ...base, strategy: relative, capital: 50 })).toBeNull();
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
    expect(getCompatibleAccounts(strategy, INITIAL_EXCHANGE_ACCOUNTS, "bogdan").map((account) => account.id)).toEqual(["acc-binance"]);
    expect(getCompatibleAccounts(strategy, INITIAL_EXCHANGE_ACCOUNTS, "anna")).toEqual([]);
  });
});

describe("linked bot counts", () => {
  it("counts ready and paused bots as active and retains stopped exposure", () => {
    const bots = ["Ready for start", "Starting", "Running", "Paused", "Stopped", "Launch failed"].map((status, index) => ({ id: index, strategyId: strategy.id, status, positions: status === "Stopped" ? [{ id: "open" }] : [] }));
    expect(countStrategyBots(strategy.id, bots)).toEqual({ active: 5, inactive: 1 });
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
