function indicatorSnapshot(id, displayName, paramsSnapshot) {
  return {
    id,
    type: "bbands",
    displayName,
    paramsSnapshot: { ...paramsSnapshot },
  };
}

/** Same Stage 1–4 shape as Epoch Details / resolveEpochStageConfig. */
export function createDemoStageConfig() {
  return {
    stage1: {
      label: "Signal",
      indicators: [
        indicatorSnapshot("bb-signal", "bb-signal", {
          timeperiod: 20,
          nbdevup: 2,
          nbdevdn: 2,
          matype: 0,
        }),
      ],
    },
    stage2: {
      label: "Entry",
      indicators: [
        indicatorSnapshot("bb-entry", "bb-entry", {
          timeperiod: 14,
          nbdevup: 2.2,
          nbdevdn: 2.2,
          matype: 0,
        }),
      ],
    },
    stage3: {
      label: "Exit",
      indicators: [
        indicatorSnapshot("bb-exit", "bb-exit", {
          timeperiod: 10,
          nbdevup: 1.8,
          nbdevdn: 1.8,
          matype: 1,
        }),
      ],
    },
    stage4: {
      riskParams: {
        stoploss: -0.035,
        trailing_activation: 0.03,
        trailing_distance: 0.015,
        loss_streak_threshold: 3,
        post_loss_cooldown_candles: 2,
      },
    },
  };
}

export const INITIAL_COMPILED_STRATEGIES = [
  {
    id: "cs-demo-1",
    name: "BTC Trend Following v1",
    description: "Saved Stage 5 configuration for BTC spot trading.",
    owner: "bogdan",
    status: "Active",
    sourceStrategyId: 1,
    blueprintName: "BTC Trend Following",
    // Must match Stage 5 seed Level-0 id so BacktestTree shows “already compiled”.
    sourceBacktestId: "oos-4f2a9c71b83d",
    backtestCreatedAt: "2026-07-28T09:14:00.000Z",
    savedAt: "2026-10-11T10:30:00.000Z",
    epochId: "favorite-risk-epoch-1",
    epochLabel: "Epoch #42",
    versionLineage: "1.1.1.1.1",
    stageConfig: createDemoStageConfig(),
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
    versionLineage: "1.1.1.1.2",
    stageConfig: createDemoStageConfig(),
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

/** Preview Telegram destinations (no tokens stored). Owned by user, reused across their bots. */
export const INITIAL_NOTIFICATION_DESTINATIONS = [
  {
    id: "tg-bogdan-private",
    owner: "bogdan",
    name: "Bogdan private alerts",
    type: "Telegram",
    chatType: "private",
    chatId: "482019375",
    status: "Preview connected",
    lastSuccessAt: "2026-10-13T10:05:00.000Z",
    lastError: null,
  },
  {
    id: "tg-bogdan-desk",
    owner: "bogdan",
    name: "Desk group",
    type: "Telegram",
    chatType: "group",
    chatId: "-1001847293011",
    status: "Preview connected",
    lastSuccessAt: "2026-10-12T16:40:00.000Z",
    lastError: "Preview delivery timeout · no Telegram API call was made",
  },
  {
    id: "tg-anna-private",
    owner: "anna",
    name: "Anna trading bot",
    type: "Telegram",
    chatType: "private",
    chatId: "901224178",
    status: "Preview connected",
    lastSuccessAt: null,
    lastError: null,
  },
];

/** Per-bot notification level for each destination: Critical | Important | All | Off. */
export const INITIAL_NOTIFICATION_LEVELS = {
  "bot-demo-1": {
    "tg-bogdan-private": "Important",
    "tg-bogdan-desk": "Critical",
  },
  "bot-demo-2": {
    "tg-bogdan-private": "All",
    "tg-bogdan-desk": "Off",
  },
  "bot-demo-3": {
    "tg-anna-private": "Important",
  },
};

/** Preview equity curve samples for BotOverview charts (`{ at, value }`). */
function createDemoEquityHistory(points) {
  return points.map(([at, value]) => ({ at, value }));
}

export const INITIAL_BOTS = [
  {
    id: "bot-demo-1", name: "BTC Momentum", strategyId: "cs-demo-1",
    owner: "bogdan", mode: "Dryrun", accountId: null, status: "Running",
    capital: 1000, maxOpenTrades: 2, realizedPnl: 32.8, startedAt: "2026-10-13T09:15:00.000Z",
    updatedAt: "2026-10-13T12:42:00.000Z", stoppedAt: null, stopIntent: null,
    orders: [
      {
        id: "ord-1", positionId: "pos-1", kind: "exit", side: "Sell",
        price: 65000, quantity: 0.00333333, status: "Open",
        createdAt: "2026-10-13T11:20:00.000Z",
      },
      {
        id: "ord-2", positionId: "pos-2", kind: "add", side: "Buy",
        price: 62500, quantity: 0.0016, status: "Open",
        createdAt: "2026-10-13T12:10:00.000Z",
      },
    ],
    positions: [
      {
        id: "pos-1", pair: "BTC/USDT", direction: "Long", stake: 200, leverage: 1,
        unrealizedPnl: 12.3, openedAt: "2026-10-13T11:15:00.000Z", quantity: 0.00333333,
        entryPrice: 60000, currentPrice: 63690, priceUpdatedAt: "2026-10-13T12:42:00.000Z",
        returnPct: 6.15, stopLoss: 58800, takeProfit: 65000, exitRule: null,
      },
      {
        id: "pos-2", pair: "BTC/USDT", direction: "Long", stake: 200, leverage: 1,
        unrealizedPnl: 3.5, openedAt: "2026-10-13T12:00:00.000Z", quantity: 0.00322581,
        entryPrice: 62000, currentPrice: 63085, priceUpdatedAt: "2026-10-13T12:42:00.000Z",
        returnPct: 1.75, stopLoss: 60760, takeProfit: null, exitRule: "Exit signal",
      },
    ],
    trades: [
      { id: "trade-1", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-13T09:42:00.000Z", closedAt: "2026-10-13T10:35:00.000Z", pnl: 12.4, stake: 200, entryPrice: 60000, exitPrice: 63720, returnPct: 6.2, exitReason: "Exit signal" },
      { id: "trade-2", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-12T18:10:00.000Z", closedAt: "2026-10-12T21:05:00.000Z", pnl: 20.4, stake: 200, entryPrice: 60000, exitPrice: 66120, returnPct: 10.2, exitReason: "Trailing stop" },
    ],
    closedTradeCount: 2, winRate: 100,
    equityHistory: createDemoEquityHistory([
      ["2026-10-12T18:00:00.000Z", 1000],
      ["2026-10-12T21:05:00.000Z", 1020.4],
      ["2026-10-13T09:15:00.000Z", 1020.4],
      ["2026-10-13T10:35:00.000Z", 1032.8],
      ["2026-10-13T11:15:00.000Z", 1040.2],
      ["2026-10-13T12:42:00.000Z", 1048.6],
    ]),
    events: [{ id: "ev-1", at: "2026-10-13T09:15:00.000Z", text: "Bot started in Dryrun mode." }],
  },
  {
    id: "bot-demo-2", name: "BTC Momentum", strategyId: "cs-demo-1",
    owner: "bogdan", mode: "Live", accountId: "acc-binance", status: "Stopped",
    capital: 2000, maxOpenTrades: 2, realizedPnl: 22.3, startedAt: "2026-10-10T08:00:00.000Z",
    updatedAt: "2026-10-12T19:00:00.000Z", stoppedAt: "2026-10-12T19:00:00.000Z", stopIntent: null,
    orders: [],
    positions: [], trades: [
      { id: "trade-3", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-11T08:10:00.000Z", closedAt: "2026-10-11T12:30:00.000Z", pnl: 22.3, stake: 200, entryPrice: 60000, exitPrice: 66690, returnPct: 11.15, exitReason: "Exit signal" },
    ], closedTradeCount: 1, winRate: 100,
    equityHistory: createDemoEquityHistory([
      ["2026-10-10T08:00:00.000Z", 2000],
      ["2026-10-11T08:10:00.000Z", 2000],
      ["2026-10-11T12:30:00.000Z", 2022.3],
      ["2026-10-12T19:00:00.000Z", 2022.3],
    ]),
    events: [{ id: "ev-2", at: "2026-10-12T19:00:00.000Z", text: "Bot stopped. History preserved." }],
  },
  {
    id: "bot-demo-3", name: "ETH Pullback", strategyId: "cs-demo-2",
    owner: "anna", mode: "Dryrun", accountId: null, status: "Stopped",
    capital: 1500, maxOpenTrades: 2, realizedPnl: -11.4, startedAt: "2026-10-09T10:10:00.000Z",
    updatedAt: "2026-10-10T13:00:00.000Z", stoppedAt: "2026-10-10T13:00:00.000Z", stopIntent: null,
    orders: [],
    positions: [], trades: [
      { id: "trade-4", pair: "ETH/USDT:USDT", direction: "Long", openedAt: "2026-10-09T11:30:00.000Z", closedAt: "2026-10-09T16:00:00.000Z", pnl: -11.4, stake: 250, entryPrice: 3000, exitPrice: 2863.2, returnPct: -4.56, exitReason: "Stop loss" },
    ], closedTradeCount: 1, winRate: 0,
    equityHistory: createDemoEquityHistory([
      ["2026-10-09T10:10:00.000Z", 1500],
      ["2026-10-09T11:30:00.000Z", 1500],
      ["2026-10-09T16:00:00.000Z", 1488.6],
      ["2026-10-10T13:00:00.000Z", 1488.6],
    ]),
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

// Preview-only restart: preserve identity, configuration and lifetime results.
export function prepareBotRestart(bot, strategy, accounts, timestamp) {
  if (!bot || !["Stopped", "Launch failed"].includes(bot.status)) return { error: "Only an inactive bot can be restarted." };
  if (!Array.isArray(bot.positions) || bot.positions.length || !Array.isArray(bot.orders) || bot.orders.length) {
    return { error: "Open positions or orders require reconciliation before restart. This preview cannot reconcile exchange state." };
  }
  const error = validateBotLaunch({ strategy, mode: bot.mode, name: bot.name, capital: bot.capital, maxOpenTrades: bot.maxOpenTrades, accountId: bot.accountId, accounts, owner: bot.owner });
  if (error) return { error };
  return { bot: { ...bot, status: "Starting", lastRestartedAt: timestamp, stoppedAt: null, stopIntent: null } };
}
