// Tag domain types, seed data, and mock current user

/** @typedef {{ id: string, name: string, ownerId: number, ownerLogin: string, createdAt: string }} Tag */

/** @typedef {{ id: string, tagId: string, objectType: "HYPEROPT_RESULT" | "MINI_BACKTEST_RESULT" | "STRATEGY" | "INDICATOR", objectId: string, objectRef: string, assignedAt: string }} TagRelation */

export const TAG_OBJECT_TYPES = {
  HYPEROPT_RESULT: "HYPEROPT_RESULT",
  MINI_BACKTEST_RESULT: "MINI_BACKTEST_RESULT",
  STRATEGY: "STRATEGY",
  INDICATOR: "INDICATOR",
};

export const MOCK_CURRENT_USER = { id: 2, login: "bogdan" };

export const INITIAL_TAGS_REGISTRY = [
  {
    id: "tag-baseline",
    name: "baseline",
    ownerId: 2,
    ownerLogin: "bogdan",
    createdAt: "2024-01-10T10:00:00",
  },
  {
    id: "tag-btc",
    name: "btc",
    ownerId: 2,
    ownerLogin: "bogdan",
    createdAt: "2024-01-10T10:05:00",
  },
  {
    id: "tag-eth",
    name: "eth",
    ownerId: 2,
    ownerLogin: "bogdan",
    createdAt: "2024-01-12T09:00:00",
  },
  {
    id: "tag-4h",
    name: "4h",
    ownerId: 2,
    ownerLogin: "bogdan",
    createdAt: "2024-01-12T09:05:00",
  },
  {
    id: "tag-momentum",
    name: "momentum",
    ownerId: 1,
    ownerLogin: "admin@example.com",
    createdAt: "2024-01-08T14:00:00",
  },
  {
    id: "tag-aggressive",
    name: "aggressive",
    ownerId: 3,
    ownerLogin: "old@example.com",
    createdAt: "2024-01-05T11:00:00",
  },
];

export const INITIAL_TAG_RELATIONS = [
  {
    id: "rel-baseline-hr1",
    tagId: "tag-baseline",
    objectType: TAG_OBJECT_TYPES.HYPEROPT_RESULT,
    objectId: "hr1",
    objectRef: "Hyperopt #1",
    assignedAt: "2024-01-15T16:09:00",
  },
  {
    id: "rel-btc-hr1",
    tagId: "tag-btc",
    objectType: TAG_OBJECT_TYPES.HYPEROPT_RESULT,
    objectId: "hr1",
    objectRef: "Hyperopt #1",
    assignedAt: "2024-01-15T16:09:00",
  },
  {
    id: "rel-eth-hr2",
    tagId: "tag-eth",
    objectType: TAG_OBJECT_TYPES.HYPEROPT_RESULT,
    objectId: "hr2",
    objectRef: "Hyperopt #2",
    assignedAt: "2024-01-14T11:58:00",
  },
  {
    id: "rel-4h-hr2",
    tagId: "tag-4h",
    objectType: TAG_OBJECT_TYPES.HYPEROPT_RESULT,
    objectId: "hr2",
    objectRef: "Hyperopt #2",
    assignedAt: "2024-01-14T11:58:00",
  },
  {
    id: "rel-momentum-s1",
    tagId: "tag-momentum",
    objectType: TAG_OBJECT_TYPES.STRATEGY,
    objectId: "1",
    objectRef: "Strategy: EMA Bounce",
    assignedAt: "2025-01-02T10:00:00",
  },
  {
    id: "rel-baseline-s2",
    tagId: "tag-baseline",
    objectType: TAG_OBJECT_TYPES.STRATEGY,
    objectId: "2",
    objectRef: "Strategy: RSI Mean Reversion",
    assignedAt: "2025-03-05T10:00:00",
  },
  {
    id: "rel-momentum-rsi",
    tagId: "tag-momentum",
    objectType: TAG_OBJECT_TYPES.INDICATOR,
    objectId: "RSI",
    objectRef: "Indicator: RSI - Relative Strength Index",
    assignedAt: "2025-01-10T10:00:00",
  },
  {
    id: "rel-btc-ema",
    tagId: "tag-btc",
    objectType: TAG_OBJECT_TYPES.INDICATOR,
    objectId: "EMA",
    objectRef: "Indicator: EMA - Exponential Moving Average",
    assignedAt: "2025-01-12T10:00:00",
  },
];

export const INITIAL_HYPEROPT_RESULTS_ROWS = [
  {
    id: "hr1",
    hyperoptNumber: 1,
    date: "2024-01-15T16:09:00",
    status: "Completed",
    pairs: "BTC/USDT",
    timeFrame: "1h",
    knowRange: "2020-01-01 – 2023-06-01",
    unknowRange: "2023-06-01 – 2023-12-31",
    tagIds: ["tag-baseline", "tag-btc"],
    comment: "First production sweep; watch drawdown in unknow range.",
    children: [
      {
        id: "hr1-1",
        analyzerNumber: 1,
        date: "2024-01-15T12:04:00",
        status: "Finished",
        minScore: "0.20",
        avgScore: "0.55",
        maxScore: "0.99",
        foldSize: "24",
        truncScores: { min: "-0.14", avg: "-0.45", max: "0.84" },
        heatmapsAndReports: [
          { id: "hr1-1-h1", date: "2024-01-15", type: "Heatmap", status: "Finished" },
          { id: "hr1-1-r1", date: "2024-01-15", type: "Report", status: "Completed" },
        ],
      },
      {
        id: "hr1-2",
        analyzerNumber: 2,
        date: "2024-01-16T10:15:00",
        status: "Finished",
        minScore: "0.18",
        avgScore: "0.52",
        maxScore: "0.87",
        heatmapsAndReports: [
          { id: "hr1-2-h1", date: "2024-01-16", type: "Heatmap", status: "Finished" },
        ],
      },
    ],
  },
  {
    id: "hr2",
    hyperoptNumber: 2,
    date: "2024-01-14T11:58:00",
    status: "In Progress",
    pairs: "ETH/USDT",
    timeFrame: "4h",
    knowRange: "2021-01-01 – 2023-09-01",
    unknowRange: "2023-09-01 – 2024-01-01",
    tagIds: ["tag-eth", "tag-4h"],
    comment: "Needs re-run after fee model update.",
    children: [
      {
        id: "hr2-1",
        analyzerNumber: 1,
        date: "2024-01-14T09:22:00",
        status: "Finished",
        minScore: "0.22",
        avgScore: "0.58",
        maxScore: "0.91",
        heatmapsAndReports: [
          { id: "hr2-1-h1", date: "2024-01-14", type: "Heatmap", status: "Finished" },
          { id: "hr2-1-r1", date: "2024-01-14", type: "Report", status: "Completed" },
        ],
      },
    ],
  },
];
