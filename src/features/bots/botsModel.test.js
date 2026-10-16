import { describe, expect, it } from "vitest";
import {
  INITIAL_COMPILED_STRATEGIES,
  INITIAL_EXCHANGE_ACCOUNTS,
  countStrategyBots,
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

  it("uses percent sizing for relative stakes and validates the launch position limit", () => {
    const relative = { ...strategy, params: { ...strategy.params, stakeMode: "relative", stakeValue: 10 } };
    expect(validateBotLaunch({ ...base, strategy: relative, capital: 50 })).toBeNull();
    expect(validateBotLaunch({ ...base, maxOpenTrades: 0 })).toContain("open position");
  });

  it("filters accounts by owner, exchange and market", () => {
    expect(getCompatibleAccounts(strategy, INITIAL_EXCHANGE_ACCOUNTS, "bogdan").map((account) => account.id)).toEqual(["acc-binance"]);
    expect(getCompatibleAccounts(strategy, INITIAL_EXCHANGE_ACCOUNTS, "anna")).toEqual([]);
  });
});

describe("linked bot counts", () => {
  it("treats Starting and Stopping as active until Stopped", () => {
    const bots = ["Starting", "Running", "Stopping", "Stopped", "Launch failed"].map((status, index) => ({ id: index, strategyId: strategy.id, status }));
    expect(countStrategyBots(strategy.id, bots)).toEqual({ active: 3, inactive: 2 });
  });
});
