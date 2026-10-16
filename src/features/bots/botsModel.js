export const INITIAL_COMPILED_STRATEGIES = [
  {
    id: "cs-demo-1",
    name: "BTC Trend Following v1",
    description: "Saved Stage 5 configuration for BTC spot trading.",
    owner: "bogdan",
    status: "Active",
    sourceStrategyId: 1,
    blueprintName: "BTC Trend Following",
    sourceBacktestId: "BT-2081",
    backtestCreatedAt: "2026-10-10T09:15:00.000Z",
    savedAt: "2026-10-11T10:30:00.000Z",
    epochId: "demo-42",
    epochLabel: "Epoch #42",
    versionLineage: "Stages 1–4",
    stageConfig: null,
    params: {
      exchange: "binance", mode: "spot", pair: "BTC/USDT", timeframe: "1h",
      leverage: 1, startingCapital: 1000, stakeMode: "fixed", stakeValue: 200,
      profitReserving: null,
      periodFrom: "2026-07-01", periodTo: "2026-09-30",
    },
    result: { roi: 18.4, maxdd: 7.2, trades: 48 },
  },
  {
    id: "cs-demo-2",
    name: "ETH Pullback v2",
    description: "Archived example with preserved bot history.",
    owner: "anna",
    status: "Archive",
    sourceStrategyId: 2,
    blueprintName: "ETH Pullback",
    sourceBacktestId: "BT-1990",
    backtestCreatedAt: "2026-10-08T11:20:00.000Z",
    savedAt: "2026-10-09T09:00:00.000Z",
    epochId: "demo-17",
    epochLabel: "Epoch #17",
    versionLineage: "Stages 1–4",
    stageConfig: null,
    params: {
      exchange: "bybit", mode: "futures", pair: "ETH/USDT:USDT", timeframe: "4h",
      leverage: 3, startingCapital: 1500, stakeMode: "fixed", stakeValue: 250,
      profitReserving: null,
      periodFrom: "2026-07-01", periodTo: "2026-09-30",
    },
    result: { roi: 12.8, maxdd: 9.1, trades: 31 },
  },
];

export const INITIAL_EXCHANGE_ACCOUNTS = [
  { id: "acc-binance", name: "Binance Main", exchange: "binance", market: "spot", balance: 3500, status: "Ready", owner: "bogdan" },
  { id: "acc-bybit", name: "Bybit Futures", exchange: "bybit", market: "futures", balance: 2800, status: "Ready", owner: "bogdan" },
];

export const INITIAL_BOTS = [
  {
    id: "bot-demo-1", name: "BTC Momentum · Dryrun", strategyId: "cs-demo-1",
    owner: "bogdan", mode: "Dryrun", accountId: null, status: "Running",
    capital: 1000, maxOpenTrades: 2, realizedPnl: 32.8, startedAt: "2026-10-13T09:15:00.000Z",
    updatedAt: "2026-10-13T12:42:00.000Z", stoppedAt: null, stopIntent: null,
    positions: [
      { id: "pos-1", pair: "BTC/USDT", direction: "Long", stake: 200, leverage: 1, unrealizedPnl: 12.3 },
      { id: "pos-2", pair: "BTC/USDT", direction: "Long", stake: 200, leverage: 1, unrealizedPnl: 3.5 },
    ],
    trades: [
      { id: "trade-1", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-13T09:42:00.000Z", closedAt: "2026-10-13T10:35:00.000Z", pnl: 12.4, exitReason: "Exit signal" },
      { id: "trade-2", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-12T18:10:00.000Z", closedAt: "2026-10-12T21:05:00.000Z", pnl: 20.4, exitReason: "Trailing stop" },
    ],
    closedTradeCount: 2, winRate: 100,
    events: [{ id: "ev-1", at: "2026-10-13T09:15:00.000Z", text: "Bot started in Dryrun mode." }],
  },
  {
    id: "bot-demo-2", name: "BTC Momentum · Live", strategyId: "cs-demo-1",
    owner: "bogdan", mode: "Live", accountId: "acc-binance", status: "Stopped",
    capital: 2000, maxOpenTrades: 2, realizedPnl: 22.3, startedAt: "2026-10-10T08:00:00.000Z",
    updatedAt: "2026-10-12T19:00:00.000Z", stoppedAt: "2026-10-12T19:00:00.000Z", stopIntent: null,
    positions: [], trades: [
      { id: "trade-3", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-11T08:10:00.000Z", closedAt: "2026-10-11T12:30:00.000Z", pnl: 22.3, exitReason: "Exit signal" },
    ], closedTradeCount: 1, winRate: 100,
    events: [{ id: "ev-2", at: "2026-10-12T19:00:00.000Z", text: "Bot stopped. History preserved." }],
  },
  {
    id: "bot-demo-3", name: "ETH Pullback · Dryrun", strategyId: "cs-demo-2",
    owner: "anna", mode: "Dryrun", accountId: null, status: "Stopped",
    capital: 1500, maxOpenTrades: 2, realizedPnl: -11.4, startedAt: "2026-10-09T10:10:00.000Z",
    updatedAt: "2026-10-10T13:00:00.000Z", stoppedAt: "2026-10-10T13:00:00.000Z", stopIntent: null,
    positions: [], trades: [
      { id: "trade-4", pair: "ETH/USDT:USDT", direction: "Long", openedAt: "2026-10-09T11:30:00.000Z", closedAt: "2026-10-09T16:00:00.000Z", pnl: -11.4, exitReason: "Stop loss" },
    ], closedTradeCount: 1, winRate: 0,
    events: [{ id: "ev-3", at: "2026-10-10T13:00:00.000Z", text: "Bot stopped. History preserved." }],
  },
];

export const ACTIVE_BOT_STATUSES = new Set(["Starting", "Running", "Stopping", "Needs attention"]);

export function isBotActive(bot) {
  return ACTIVE_BOT_STATUSES.has(bot.status);
}

export function countStrategyBots(strategyId, bots) {
  const related = bots.filter((bot) => bot.strategyId === strategyId);
  return {
    active: related.filter(isBotActive).length,
    inactive: related.filter((bot) => !isBotActive(bot)).length,
  };
}

export function getCompatibleAccounts(strategy, accounts, owner) {
  return accounts.filter((account) =>
    account.owner === owner && account.status === "Ready" &&
    account.exchange === strategy.params.exchange && account.market === strategy.params.mode,
  );
}

export function validateBotLaunch({ strategy, mode, name, capital, maxOpenTrades = 2, accountId, accounts, owner }) {
  if (!strategy || strategy.status !== "Active") return "Restore the strategy before launching.";
  if (!name?.trim()) return "Enter a bot name.";
  const stake = Number(strategy.params.stakeValue || 0);
  const amount = Number(capital);
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a positive capital amount.";
  if (strategy.params.stakeMode === "relative") {
    if (!(stake > 0 && stake <= 100)) return "Stake percentage must be between 0 and 100%.";
  } else if (!(stake > 0) || amount < stake) {
    return `Capital must be at least the stake amount: ${stake} USDT.`;
  }
  if (!Number.isInteger(Number(maxOpenTrades)) || Number(maxOpenTrades) < 1) return "Enter at least one open position.";
  if (mode !== "Dryrun" && mode !== "Live") return "Select a trading mode.";
  if (mode === "Live") {
    if (!accountId) return "Select an exchange account.";
    const account = getCompatibleAccounts(strategy, accounts, owner).find((item) => item.id === accountId);
    if (!account) return "Select a compatible exchange account.";
    if (amount > account.balance) return `Available account balance: ${account.balance.toLocaleString("en-US")} USDT.`;
  }
  return null;
}

export function getBacktestSummary(run) {
  const core = run?.result?.core || {};
  return {
    roi: core.roi ?? null,
    maxdd: core.maxdd ?? null,
    trades: core.trades ?? null,
  };
}
