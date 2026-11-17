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

const DEMO_BACKTEST_SOURCES = [
  {
    sourceStrategyId: 1,
    blueprintName: "EMA Bounce",
    // Matches the Stage 5 seed Level-0 run.
    sourceBacktestId: "oos-4f2a9c71b83d",
    backtestStatus: "done",
    backtestCreatedAt: "2026-07-28T09:14:00.000Z",
    epochId: "favorite-risk-epoch-1",
    epochLabel: "Epoch #126 · BTC/USDT · 1h · Full data",
    versionLineage: "1.1.1.1.1",
    stageConfig: createDemoStageConfig(),
    params: {
      exchange: "binance", mode: "spot", pair: "BTC/USDT", timeframe: "1h",
      leverage: 1, startingCapital: 10000, stakeMode: "fixed", stakeValue: 100,
      profitReserving: null,
      periodFrom: "2023-01-01", periodTo: "2023-06-30",
    },
    result: null,
  },
  {
    sourceStrategyId: 2,
    blueprintName: "ETH Pullback",
    sourceBacktestId: "BT-1990",
    backtestStatus: "done",
    backtestCreatedAt: "2026-10-08T11:20:00.000Z",
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
  { id: "acc-binance", name: "Binance Main", exchange: "binance", market: "spot", status: "Ready", owner: "bogdan" },
  { id: "acc-bybit", name: "Bybit Futures", exchange: "bybit", market: "futures", status: "Ready", owner: "bogdan" },
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

// Illustrative wins and losses with zero combined P&L, preserving the demo's total result.
const DEMO_EARLY_TRADES = [
  ["2026-10-05", 8.4, "Exit signal"], ["2026-10-06", -6.2, "Stop loss"],
  ["2026-10-07", 12.8, "Trailing stop"], ["2026-10-08", -9.4, "Stop loss"],
  ["2026-10-09", 5.6, "Exit signal"], ["2026-10-10", -11.2, "Stop loss"],
].map(([day, pnl, exitReason], index) => ({
  id: `trade-${index + 5}`, pair: "BTC/USDT", direction: "Long", stake: 200,
  openedAt: `${day}T09:00:00.000Z`, closedAt: `${day}T15:30:00.000Z`,
  entryPrice: 60000, exitPrice: 60000 * (1 + pnl / 200), quantity: 200 / 60000,
  pnl, returnPct: pnl / 200 * 100, exitReason, stopLoss: 57000, reservedAmount: 0,
}));

const DEMO_BOTS = [
  {
    id: "bot-demo-1", name: "BTC Momentum", sourceIndex: 0,
    owner: "bogdan", mode: "Dryrun", accountId: null, status: "Running",
    capital: 1000, maxOpenTrades: 2, stakeMode: "fixed", stakeValue: 200, realizedPnl: 32.8, startedAt: "2026-10-05T08:00:00.000Z",
    reportedMetrics: { totalBalance: 1032.8, tradableBalance: 1032.8, reservedBalance: 0, totalChangePct: 3.28, tradableChangePct: 3.28, reservedChangePct: null, calmar: null, cagrTotal: null, cagrTradable: null, openTradeFees: 0.42, closedTradeFees: 1.87, totalFunding: null, feesAndFunding: null },
    engineVersion: "hotfix.3.2.9", forceEntry: false, profitReserve: 0,
    updatedAt: "2026-10-13T12:42:00.000Z", marketSnapshotAt: "2026-10-13T12:42:00.000Z", lastHeartbeatAt: "2026-10-13T12:42:00.000Z", stoppedAt: null, stopIntent: null,
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
        stopOnExchange: true, stopDistancePct: 7.68, entrySignalPrice: 59980,
        entrySignalAt: "2026-10-13T11:14:30.000Z", entryDelaySec: 30,
        entryPriceDifferencePct: 0.03, entryFee: 0.12,
      },
      {
        id: "pos-2", pair: "BTC/USDT", direction: "Long", stake: 200, leverage: 1,
        unrealizedPnl: 3.5, openedAt: "2026-10-13T12:00:00.000Z", quantity: 200 / (63690 / 1.0175),
        entryPrice: 63690 / 1.0175, currentPrice: 63690, priceUpdatedAt: "2026-10-13T12:42:00.000Z",
        returnPct: 1.75, stopLoss: 60760, takeProfit: null, exitRule: "Exit signal",
      },
    ],
    trades: [
      ...DEMO_EARLY_TRADES,
      { id: "trade-1", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-13T09:42:00.000Z", closedAt: "2026-10-13T10:35:00.000Z", pnl: 12.4, stake: 200, entryPrice: 60000, exitPrice: 63720, returnPct: 6.2, exitReason: "Exit signal", entrySignalAt: "2026-10-13T09:41:25.000Z", entrySignalPrice: 59940, entryDelaySec: 35, entryPriceDifferencePct: 0.1, exitSignalAt: "2026-10-13T10:34:40.000Z", exitSignalPrice: 63680, exitDelaySec: 20, exitPriceDifferencePct: 0.06, entryFee: 0.08, exitFee: 0.09, durationCandles: 1, notionalAmount: 200, reservedAmount: 0 },
      { id: "trade-2", pair: "BTC/USDT", direction: "Long", openedAt: "2026-10-12T18:10:00.000Z", closedAt: "2026-10-12T21:05:00.000Z", pnl: 20.4, stake: 200, entryPrice: 60000, exitPrice: 66120, returnPct: 10.2, exitReason: "Trailing stop" },
    ],
    closedTradeCount: 8, winRate: 62.5,
    equityHistory: createDemoEquityHistory([
      ["2026-10-05T08:00:00.000Z", 1000],
      ["2026-10-05T15:30:00.000Z", 1008.4],
      ["2026-10-06T15:30:00.000Z", 1002.2],
      ["2026-10-07T15:30:00.000Z", 1015],
      ["2026-10-08T15:30:00.000Z", 1005.6],
      ["2026-10-09T15:30:00.000Z", 1011.2],
      ["2026-10-10T15:30:00.000Z", 1000],
      ["2026-10-12T18:00:00.000Z", 1000],
      ["2026-10-12T21:05:00.000Z", 1020.4],
      ["2026-10-13T09:15:00.000Z", 1020.4],
      ["2026-10-13T10:35:00.000Z", 1032.8],
      ["2026-10-13T11:15:00.000Z", 1040.2],
      ["2026-10-13T12:42:00.000Z", 1048.6],
    ]),
    events: [{ id: "ev-1", at: "2026-10-05T08:00:00.000Z", text: "Bot started in Dryrun mode." }],
  },
  {
    id: "bot-demo-2", name: "BTC Momentum", sourceIndex: 0,
    owner: "bogdan", mode: "Live", accountId: "acc-binance", status: "Stopped",
    capital: 2000, maxOpenTrades: 1, stakeMode: "fixed", stakeValue: 200, realizedPnl: 22.3, startedAt: "2026-10-10T08:00:00.000Z",
    updatedAt: "2026-10-12T19:00:00.000Z", marketSnapshotAt: "2026-10-12T19:00:00.000Z", lastHeartbeatAt: "2026-10-12T19:00:00.000Z", stoppedAt: "2026-10-12T19:00:00.000Z", stopIntent: null,
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
    id: "bot-demo-3", name: "ETH Pullback", sourceIndex: 1,
    owner: "anna", mode: "Dryrun", accountId: null, status: "Stopped",
    capital: 1500, maxOpenTrades: 1, stakeMode: "fixed", stakeValue: 250, realizedPnl: -11.4, startedAt: "2026-10-09T10:10:00.000Z",
    updatedAt: "2026-10-10T13:00:00.000Z", marketSnapshotAt: "2026-10-10T13:00:00.000Z", lastHeartbeatAt: "2026-10-10T13:00:00.000Z", stoppedAt: "2026-10-10T13:00:00.000Z", stopIntent: null,
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
  {
    id: "bot-demo-4", name: "BTC Ready", sourceIndex: 0,
    owner: "bogdan", mode: "Dryrun", accountId: null, feeSource: "exchange", status: "Ready for start",
    capital: 1000, maxOpenTrades: 1, stakeMode: "fixed", stakeValue: 200, realizedPnl: 0, profitReserve: 0,
    forceEntry: false, engineVersion: "hotfix.3.2.9",
    createdAt: "2026-11-09T09:00:00.000Z", startedAt: null,
    updatedAt: "2026-11-09T09:00:00.000Z", marketSnapshotAt: null, lastHeartbeatAt: null, stoppedAt: null, stopIntent: null,
    orders: [], positions: [], trades: [], closedTradeCount: 0, winRate: null, equityHistory: [],
    events: [{ id: "ev-4", at: "2026-11-09T09:00:00.000Z", text: "Bot created in Dryrun mode. Awaiting manual start." }],
  },
];

export const INITIAL_BOTS = DEMO_BOTS.map(({ sourceIndex, ...bot }) => ({
  ...bot,
  description: "",
  source: structuredClone(DEMO_BACKTEST_SOURCES[sourceIndex]),
}));

export const ACTIVE_BOT_STATUSES = new Set(["Ready for start", "Starting", "Running", "Paused", "Needs attention"]);

// Prototype-only freshness window; production heartbeat source and timeout are open in D9.
export const PREVIEW_RUNTIME_TIMEOUT_MS = 60_000;

export function getBotRuntimeAvailability(bot, asOf = Date.now()) {
  if (!["Starting", "Running", "Paused", "Needs attention"].includes(bot.status)) return "Offline";
  const lastSeen = Date.parse(bot.lastHeartbeatAt);
  return Number.isFinite(lastSeen) && lastSeen <= asOf && asOf - lastSeen < PREVIEW_RUNTIME_TIMEOUT_MS
    ? "Online" : "Offline";
}

export function isBotActive(bot) {
  return ACTIVE_BOT_STATUSES.has(bot.status) || (bot.status === "Stopped" && Boolean(bot.positions?.length || bot.orders?.length));
}

export function getCompatibleAccounts(source, accounts, owner) {
  return accounts.filter((account) =>
    account.owner === owner && account.status === "Ready" &&
    account.exchange === source?.params?.exchange && account.market === source?.params?.mode,
  );
}

export function validateBotLaunch({ source, mode, name, capital, maxOpenTrades = 1, stakeMode, stakeValue, accountId, accounts, owner }) {
  if (!source?.sourceBacktestId || source.backtestStatus !== "done" || !source?.params) return "Select a successful backtest.";
  if (!name?.trim()) return "Enter a bot name.";
  const stake = Number(stakeValue ?? source.params.stakeValue ?? 0);
  const selectedStakeMode = stakeMode || source.params.stakeMode;
  const amount = Number(capital);
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a positive capital amount.";
  if (selectedStakeMode === "relative") {
    if (!(stake > 0 && stake <= 100)) return "Stake percentage must be between 0 and 100%.";
  } else if (!(stake > 0) || amount < stake) {
    return `Capital must be at least the stake amount: ${stake} USDT.`;
  }
  if (Number(maxOpenTrades) !== 1) return "Maximum open positions is fixed at 1.";
  if (mode !== "Dryrun" && mode !== "Live") return "Select a trading mode.";
  if (mode === "Live") {
    if (!accountId) return "Select an exchange account.";
    const account = getCompatibleAccounts(source, accounts, owner).find((item) => item.id === accountId);
    if (!account) return "Select a compatible exchange account.";
  }
  if (mode === "Dryrun" && accountId && !getCompatibleAccounts(source, accounts, owner).some((item) => item.id === accountId)) {
    return "Select a compatible fee account or use exchange fees.";
  }
  return null;
}

export function occupiesLivePair(bot) {
  return bot.mode === "Live" && (
    ["Starting", "Running", "Paused", "Needs attention"].includes(bot.status) ||
    (bot.status === "Stopped" && Boolean(bot.positions?.length || bot.orders?.length))
  );
}

export function findLivePairConflict(bots, target) {
  if (target.mode !== "Live") return null;
  return bots.find((bot) => bot.id !== target.id && occupiesLivePair(bot) &&
    bot.accountId === target.accountId && bot.source?.params?.pair === target.source?.params?.pair) || null;
}

export function getBacktestSummary(run) {
  const core = run?.result?.core || {};
  return {
    roi: core.roi ?? null,
    maxdd: core.maxdd ?? null,
    trades: core.trades ?? null,
  };
}
