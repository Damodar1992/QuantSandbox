// Application-level constants

export const MOCK_OPTIMIZATION_RUNS = [
  {
    id: "run-1",
    date: "2026-01-23 23:00:00",
    pairs: ["BTC/USDT", "ETH/USDT"],
    timeRange: "15m",
    timeFrameStart: "2020-01-23",
    timeFrameEnd: "2023-01-23",
    status: "completed",
    indicators: ["rsi_close", "ema_close", "macd"],
    profit: "+18.5%",
    trades: 245,
    winRate: "64%"
  },
  {
    id: "run-2",
    date: "2026-01-20 15:30:00",
    pairs: ["BTC/USDT"],
    timeRange: "1h",
    timeFrameStart: "2021-06-01",
    timeFrameEnd: "2023-12-31",
    status: "completed",
    indicators: ["bulinger", "macd", "ema_slope_20", "ema_trend_close_200_close"],
    profit: "+25.3%",
    trades: 187,
    winRate: "71%"
  }
];

export const SECTIONS = ["Strategies", "Users", "Settings"];
// No disabled sections at the moment
export const DISABLED_SECTIONS = new Set([]);

export const PAIR_OPTIONS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "ADA/USDT"];
export const TIME_RANGES = ["15m", "30m", "1h", "4h", "1d"];

export const INITIAL_STRATEGIES = [
  {
    id: 1,
    name: "EMA Bounce",
    owner: "bogdan",
    versions: [
      {
        id: 11,
        version: "1",
        currentStage: "Signal",
        status: "Draft",
        createdAt: "2025-01-01",
        description: "Trend-follow strategy (initial version)",
        code: `# EMA Bounce v1\n# TODO: add strategy code here`,
      },
      {
        id: 12,
        version: "2",
        currentStage: "Entry",
        status: "Active",
        createdAt: "2025-02-10",
        description: "Improved risk management and filters",
        code: `# EMA Bounce v2\n# TODO: add updated strategy code here`,
      },
    ],
  },
  {
    id: 2,
    name: "RSI Mean Reversion",
    owner: "bogdan",
    versions: [
      {
        id: 21,
        version: "3",
        currentStage: "Risk",
        status: "Draft",
        createdAt: "2025-03-05",
        description: "Initial RSI-based reversion logic",
        code: `# RSI Mean Reversion v3\n# TODO: add strategy code here`,
      },
    ],
  },
];
