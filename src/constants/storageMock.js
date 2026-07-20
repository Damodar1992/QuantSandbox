/**
 * Storage RAW data management — self-contained mock dataset.
 *
 * Hierarchy:
 *   strategy -> stageVersions[] (flat, parentVersionId links) -> hyperopts[]
 *
 * Stage order (for "selected + subsequent stages" cascade rule):
 *   signal=1, entry=2, exit=3, risk=4
 */

export const STORAGE_QUOTA_GB = 500;

export const STAGE_ORDER = { signal: 1, entry: 2, exit: 3, risk: 4 };

// ---------------------------------------------------------------------------
// Strategy 1 — "EMA Bounce" (owner: bogdan / id 2)
// ---------------------------------------------------------------------------

const s1 = [
  // ── Signal stage versions ───────────────────────────────────────────────
  {
    id: "sv-s1-sig-1",
    stageType: "signal",
    versionNumber: "1",
    parentVersionId: null,
    hyperopts: [
      {
        id: "sto-h1", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: ["tag-baseline", "tag-btc"],
        comment: "First broad sweep.",
        status: "Completed", rawSizeGb: 18.4,
      },
      {
        id: "sto-h2", pairs: "BTC/USDT", timeframe: "4h",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: ["tag-btc"],
        comment: "",
        status: "Raw data deleted", rawSizeGb: 0,
      },
    ],
  },
  {
    id: "sv-s1-sig-2",
    stageType: "signal",
    versionNumber: "2",
    parentVersionId: null,
    hyperopts: [
      {
        id: "sto-h3", pairs: "ETH/USDT", timeframe: "1h",
        timeRange: "2021-01-01 – 2023-06-01",
        tagIds: ["tag-eth"],
        comment: "ETH variant.",
        status: "Completed", rawSizeGb: 12.1,
      },
    ],
  },
  // ── Entry stage versions ─────────────────────────────────────────────────
  {
    id: "sv-s1-ent-1-1",
    stageType: "entry",
    versionNumber: "1.1",
    parentVersionId: "sv-s1-sig-1",
    hyperopts: [
      {
        id: "sto-h4", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: ["tag-baseline"],
        comment: "",
        status: "Completed", rawSizeGb: 9.7,
      },
      {
        id: "sto-h5", pairs: "BTC/USDT", timeframe: "15m",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: [],
        comment: "15-min variant.",
        status: "Failed", rawSizeGb: 3.2,
      },
    ],
  },
  {
    id: "sv-s1-ent-1-2",
    stageType: "entry",
    versionNumber: "1.2",
    parentVersionId: "sv-s1-sig-1",
    hyperopts: [
      {
        id: "sto-h6", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2021-06-01 – 2023-12-31",
        tagIds: ["tag-aggressive"],
        comment: "Aggressive ranges.",
        status: "Completed", rawSizeGb: 14.8,
      },
    ],
  },
  {
    id: "sv-s1-ent-2-1",
    stageType: "entry",
    versionNumber: "2.1",
    parentVersionId: "sv-s1-sig-2",
    hyperopts: [
      {
        id: "sto-h7", pairs: "ETH/USDT", timeframe: "1h",
        timeRange: "2021-01-01 – 2023-06-01",
        tagIds: ["tag-eth"],
        comment: "",
        status: "Running", rawSizeGb: 0,
      },
    ],
  },
  // ── Exit stage versions ──────────────────────────────────────────────────
  {
    id: "sv-s1-ext-1-1-1",
    stageType: "exit",
    versionNumber: "1.1.1",
    parentVersionId: "sv-s1-ent-1-1",
    hyperopts: [
      {
        id: "sto-h8", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: ["tag-baseline", "tag-btc"],
        comment: "",
        status: "Completed", rawSizeGb: 7.3,
      },
    ],
  },
  {
    id: "sv-s1-ext-1-2-1",
    stageType: "exit",
    versionNumber: "1.2.1",
    parentVersionId: "sv-s1-ent-1-2",
    hyperopts: [
      {
        id: "sto-h9", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2021-06-01 – 2023-12-31",
        tagIds: ["tag-aggressive"],
        comment: "Fast exit test.",
        status: "Raw data deleted", rawSizeGb: 0,
      },
      {
        id: "sto-h10", pairs: "BTC/USDT", timeframe: "4h",
        timeRange: "2021-06-01 – 2023-12-31",
        tagIds: [],
        comment: "",
        status: "Completed", rawSizeGb: 11.6,
      },
    ],
  },
  // ── Risk stage versions ──────────────────────────────────────────────────
  {
    id: "sv-s1-risk-1-1-1-1",
    stageType: "risk",
    versionNumber: "1.1.1.1",
    parentVersionId: "sv-s1-ext-1-1-1",
    hyperopts: [
      {
        id: "sto-h11", pairs: "BTC/USDT", timeframe: "1h",
        timeRange: "2020-01-01 – 2023-06-01",
        tagIds: ["tag-baseline"],
        comment: "Stoploss grid.",
        status: "Completed", rawSizeGb: 22.0,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Strategy 2 — "RSI Mean Reversion" (owner: admin / id 1)
// ---------------------------------------------------------------------------

const s2 = [
  {
    id: "sv-s2-sig-1",
    stageType: "signal",
    versionNumber: "1",
    parentVersionId: null,
    hyperopts: [
      {
        id: "sto-h20", pairs: "ETH/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-eth", "tag-4h"],
        comment: "Baseline RSI sweep.",
        status: "Completed", rawSizeGb: 31.5,
      },
      {
        id: "sto-h21", pairs: "BTC/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-btc", "tag-4h"],
        comment: "",
        status: "Completed", rawSizeGb: 28.9,
      },
    ],
  },
  {
    id: "sv-s2-sig-2",
    stageType: "signal",
    versionNumber: "2",
    parentVersionId: null,
    hyperopts: [
      {
        id: "sto-h22", pairs: "SOL/USDT", timeframe: "1h",
        timeRange: "2022-01-01 – 2024-01-01",
        tagIds: [],
        comment: "SOL pair test.",
        status: "Completed", rawSizeGb: 19.2,
      },
    ],
  },
  {
    id: "sv-s2-ent-1-1",
    stageType: "entry",
    versionNumber: "1.1",
    parentVersionId: "sv-s2-sig-1",
    hyperopts: [
      {
        id: "sto-h23", pairs: "ETH/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-eth"],
        comment: "",
        status: "Completed", rawSizeGb: 16.3,
      },
      {
        id: "sto-h24", pairs: "BTC/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-btc"],
        comment: "",
        status: "Raw data deleted", rawSizeGb: 0,
      },
    ],
  },
  {
    id: "sv-s2-ext-1-1-1",
    stageType: "exit",
    versionNumber: "1.1.1",
    parentVersionId: "sv-s2-ent-1-1",
    hyperopts: [
      {
        id: "sto-h25", pairs: "ETH/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-eth"],
        comment: "Trailing stop grid.",
        status: "Failed", rawSizeGb: 4.1,
      },
      {
        id: "sto-h26", pairs: "ETH/USDT", timeframe: "1h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: [],
        comment: "",
        status: "Completed", rawSizeGb: 9.8,
      },
    ],
  },
  {
    id: "sv-s2-risk-1-1-1-1",
    stageType: "risk",
    versionNumber: "1.1.1.1",
    parentVersionId: "sv-s2-ext-1-1-1",
    hyperopts: [
      {
        id: "sto-h27", pairs: "ETH/USDT", timeframe: "4h",
        timeRange: "2021-01-01 – 2024-01-01",
        tagIds: ["tag-eth", "tag-4h"],
        comment: "Full risk grid.",
        status: "Completed", rawSizeGb: 41.2,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Strategy 3 — "BB Trend Follow" (owner: bogdan / id 2)
// ---------------------------------------------------------------------------

const s3 = [
  {
    id: "sv-s3-sig-1",
    stageType: "signal",
    versionNumber: "1",
    parentVersionId: null,
    hyperopts: [
      {
        id: "sto-h30", pairs: "BTC/USDT", timeframe: "15m",
        timeRange: "2022-01-01 – 2024-06-01",
        tagIds: ["tag-btc", "tag-baseline"],
        comment: "BB period grid.",
        status: "Completed", rawSizeGb: 25.4,
      },
    ],
  },
  {
    id: "sv-s3-ent-1-1",
    stageType: "entry",
    versionNumber: "1.1",
    parentVersionId: "sv-s3-sig-1",
    hyperopts: [
      {
        id: "sto-h31", pairs: "BTC/USDT", timeframe: "15m",
        timeRange: "2022-01-01 – 2024-06-01",
        tagIds: [],
        comment: "",
        status: "Completed", rawSizeGb: 15.6,
      },
    ],
  },
  {
    id: "sv-s3-ent-1-2",
    stageType: "entry",
    versionNumber: "1.2",
    parentVersionId: "sv-s3-sig-1",
    hyperopts: [
      {
        id: "sto-h32", pairs: "BTC/USDT", timeframe: "30m",
        timeRange: "2022-01-01 – 2024-06-01",
        tagIds: ["tag-momentum"],
        comment: "30-min variant.",
        status: "Completed", rawSizeGb: 13.7,
      },
      {
        id: "sto-h33", pairs: "ETH/USDT", timeframe: "30m",
        timeRange: "2022-01-01 – 2024-06-01",
        tagIds: [],
        comment: "",
        status: "Raw data deleted", rawSizeGb: 0,
      },
    ],
  },
];

/** Hyperopt-level owner overrides for demo variety (defaults to strategy owner). */
const HYPEROPT_OWNER_OVERRIDES = {
  "sto-h3": { ownerId: 1, ownerLogin: "admin" },
  "sto-h7": { ownerId: 3, ownerLogin: "old@example.com" },
  "sto-h20": { ownerId: 1, ownerLogin: "admin" },
  "sto-h22": { ownerId: 3, ownerLogin: "old@example.com" },
  "sto-h25": { ownerId: 1, ownerLogin: "admin" },
  "sto-h32": { ownerId: 3, ownerLogin: "old@example.com" },
};

function withHyperoptOwners(strategies) {
  return strategies.map((strategy) => ({
    ...strategy,
    stageVersions: (strategy.stageVersions ?? []).map((sv) => ({
      ...sv,
      hyperopts: (sv.hyperopts ?? []).map((h) => {
        const override = HYPEROPT_OWNER_OVERRIDES[h.id];
        return {
          ...h,
          ownerId: override?.ownerId ?? strategy.ownerId,
          ownerLogin: override?.ownerLogin ?? strategy.ownerLogin,
        };
      }),
    })),
  }));
}

export const INITIAL_STORAGE_STRATEGIES = withHyperoptOwners([
  {
    id: "str-1",
    name: "EMA Bounce",
    description: "Trend-follow strategy based on EMA crossover with BB validation.",
    ownerId: 2,
    ownerLogin: "bogdan",
    stageVersions: s1,
  },
  {
    id: "str-2",
    name: "RSI Mean Reversion",
    description: "Counter-trend strategy on RSI extremes with dynamic exits.",
    ownerId: 1,
    ownerLogin: "admin",
    stageVersions: s2,
  },
  {
    id: "str-3",
    name: "BB Trend Follow",
    description: "Breakout strategy using Bollinger Band width as a volatility filter.",
    ownerId: 2,
    ownerLogin: "bogdan",
    stageVersions: s3,
  },
]);
