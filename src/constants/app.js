// Application-level constants

export const SECTIONS = ["Strategies", "Backtesting", "Users", "Settings"];
// Only Backtesting is disabled in the header; Users is now available
export const DISABLED_SECTIONS = new Set(["Backtesting"]);

export const PAIR_OPTIONS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "ADA/USDT"];
export const TIME_RANGES = ["5m", "10m", "15m", "30m", "1h", "4h", "1d"];

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
