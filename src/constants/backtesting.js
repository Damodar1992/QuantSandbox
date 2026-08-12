// Stage 5 · Backtesting — enums, reference tables and copy.
// Based on the tech spec "QuantSandbox · Stage 5 — Backtesting" v1.0.
// No UI here: only data, formulas and static copy.

/** Id of the demo favorite epoch seeded into Stage 4 so Stage 5 has an input. */
export const BT_DEMO_EPOCH_ID = "favorite-risk-epoch-1";

/* ------------------------------------------------------------------ market */

export const BT_PAIR_OPTIONS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
];

export const BT_TIMEFRAMES = ["5m", "15m", "30m", "1h", "4h", "1d"];

export const BT_EXCHANGES = [
  { value: "binance", label: "Binance" },
  { value: "htx", label: "HTX" },
];

export const BT_TRADING_MODES = [
  { value: "spot", label: "spot" },
  { value: "futures", label: "futures" },
];

export const BT_STAKE_MODES = [
  { value: "fixed", label: "Fixed — USDT per trade" },
  { value: "relative", label: "Relative — % of balance" },
];

export const BT_LEVERAGE_RANGE = { min: 1, max: 125 };

/**
 * Fees are never entered by hand — they are derived from exchange + mode.
 * Values are percents.
 */
export const BT_FEE_TABLE = {
  binance: {
    spot: { maker: 0.1, taker: 0.1, funding: false },
    futures: { maker: 0.05, taker: 0.02, funding: true },
  },
  htx: {
    spot: { maker: 0.2, taker: 0.2, funding: false },
    futures: { maker: 0.05, taker: 0.02, funding: true },
  },
};

/** @returns {{maker:number, taker:number, funding:boolean}} */
export function resolveBtFees(exchange, mode) {
  const byExchange = BT_FEE_TABLE[exchange] || BT_FEE_TABLE.binance;
  return byExchange[mode] || byExchange.spot;
}

/* ----------------------------------------------------------------- statuses */

export const BT_RUN_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
};

export const BT_ANALYTICS_STATUS = {
  DRAFT: "draft",
  SAVED: "saved",
};

/** Maps an internal run status onto the shared AppBadge vocabulary. */
export const BT_STATUS_BADGE = {
  [BT_RUN_STATUS.QUEUED]: "Warning",
  [BT_RUN_STATUS.RUNNING]: "In Progress",
  [BT_RUN_STATUS.DONE]: "Completed",
  [BT_RUN_STATUS.FAILED]: "Failed",
};

export const BT_ERROR_CODES = {
  INCOMPLETE_CONFIG: {
    code: "INCOMPLETE_CONFIG",
    message: "The backtester rejected the run configuration.",
    hint: "Open Run parameters, fill in every required field and start the run again.",
  },
  NO_DATA_FOR_PERIOD: {
    code: "NO_DATA_FOR_PERIOD",
    message: "No candles for the requested pair on the requested period.",
    hint: "Shorten the period or pick another pair / timeframe.",
  },
  ENGINE_TIMEOUT: {
    code: "ENGINE_TIMEOUT",
    message: "The engine did not finish in time.",
    hint: "Reduce the number of simulations and retry.",
  },
};

/* ------------------------------------------------------------- child types */

export const BT_CHILD_TYPE = {
  SHUFFLER: "shuffler",
  SYNTHETIC: "synthetic",
  ANALYTICS: "analytics",
};

export const BT_CHILD_TAG = {
  [BT_CHILD_TYPE.SHUFFLER]: { glyph: "⇄", label: "Shuffler" },
  [BT_CHILD_TYPE.SYNTHETIC]: { glyph: "∿", label: "Synthetic" },
  [BT_CHILD_TYPE.ANALYTICS]: { glyph: "▤", label: "Analytics" },
};

/* ----------------------------------------------------------- core  metrics */

/**
 * The six core metrics shared by all three lines of the validation matrix.
 * `dir` — which direction is favourable; `drawdown` metrics are written
 * positive but are always a loss (amber, see §8.7).
 */
export const BT_CORE_METRICS = [
  {
    key: "roi",
    label: "ROI",
    unit: "%",
    dir: "higher",
    decimals: 2,
    formula: "ROI = (final_balance − starting_balance) / starting_balance × 100%",
    description: "Return on the starting capital over the whole run.",
  },
  {
    key: "pnl",
    label: "PnL",
    unit: "USDT",
    dir: "higher",
    decimals: 2,
    formula: "PnL = Σ net_profit(trade)",
    description: "Net result of every closed trade, fees and funding included.",
  },
  {
    key: "maxdd",
    label: "Max Drawdown",
    unit: "%",
    dir: "lower",
    kind: "drawdown",
    decimals: 2,
    formula: "MaxDD = max over t of (peak_balance(t) − balance(t)) / peak_balance(t) × 100%",
    description: "Deepest fall from a balance peak. Written positive, always a loss.",
  },
  {
    key: "pf",
    label: "Profit Factor",
    unit: "",
    dir: "higher",
    decimals: 2,
    formula: "PF = Σ gross_profit / |Σ gross_loss|",
    description: "Gross profit per unit of gross loss. ∞ when there are no losing trades.",
  },
  {
    key: "winrate",
    label: "Win Rate",
    unit: "%",
    dir: "higher",
    decimals: 1,
    formula: "WinRate = winning_trades / total_trades × 100%",
    description: "Share of closed trades that ended in profit.",
  },
  {
    key: "trades",
    label: "Total Trades",
    unit: "",
    dir: "neutral",
    decimals: 0,
    formula: "Trades = count(closed_trades)",
    description: "Number of closed trades — the sample size behind every other metric.",
  },
];

export const BT_CORE_METRIC_BY_KEY = BT_CORE_METRICS.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {});

/* ------------------------------------------------------------------ shuffler */

export const BT_SIM_MODES = [
  { value: "static", label: "STATIC" },
  { value: "dynamic", label: "DYNAMIC" },
];

export const BT_SIM_MODE_HINT =
  "STATIC → the stake never compounds, so PnL is invariant under permutation (only MaxDD is valid). " +
  "DYNAMIC → compounding brings ROI and Profit Factor alive.";

export const BT_SIM_MODE_TIP = {
  text: "**STATIC** — the stake never compounds, so PnL is invariant under permutation (only MaxDD is valid). **DYNAMIC** — compounding brings ROI and Profit Factor alive.",
};

export const BT_SHUFFLES_PRESETS = [5, 100, 500, 1000, 2000, 3000];
export const BT_SHUFFLES_DEFAULT = 500;

export const BT_SHUFFLE_APPROACHES = [
  { value: "full", label: "FULL" },
  { value: "block_by_streak", label: "BLOCK BY WIN-LOSS STREAKS" },
  { value: "levels", label: "LEVELS" },
];

export const BT_PESSIMISM_LEVELS = ["L1", "L2", "L3", "L4", "L5"];

export const BT_PESSIMISM_DEFAULT_SHARES = {
  L1: 40,
  L2: 25,
  L3: 20,
  L4: 10,
  L5: 5,
};

/** Which levels are enabled when the stress-test is switched on. */
export const BT_PESSIMISM_DEFAULT_ENABLED = {
  L1: false,
  L2: true,
  L3: true,
  L4: true,
  L5: false,
};

/**
 * Multipliers applied to the Original streaks to derive a level target.
 * Higher level = more pessimistic (longer loss streaks, shorter win streaks).
 */
export const BT_PESSIMISM_LEVEL_FACTORS = {
  L1: { loss: 1.1, win: 0.95 },
  L2: { loss: 1.25, win: 0.85 },
  L3: { loss: 1.5, win: 0.75 },
  L4: { loss: 2.0, win: 0.5 },
  L5: { loss: 2.5, win: 0.25 },
};

export const BT_STREAK_METRICS = [
  { key: "mcl", label: "MCL", title: "Max consecutive losses", enforced: true },
  { key: "mcw", label: "MCW", title: "Max consecutive wins", enforced: true },
  { key: "acl", label: "ACL", title: "Avg consecutive losses", enforced: true },
  { key: "acw", label: "ACW", title: "Avg consecutive wins", enforced: false },
];

/** Metric validity per simulation mode — §6.2.1. */
export const BT_SHUFFLER_VALIDITY_REFERENCE = [
  {
    metric: "Max Drawdown",
    validWhen: "Always",
    why: "Drawdown depends on the order of trades, so every permutation produces a new value.",
  },
  {
    metric: "ROI",
    validWhen: "DYNAMIC, or when a run stopped out",
    why: "Under STATIC the stake never compounds, so the sum of results is order-invariant.",
  },
  {
    metric: "PnL",
    validWhen: "DYNAMIC, or when a run stopped out",
    why: "Same reason as ROI — a fixed stake makes the total a plain sum.",
  },
  {
    metric: "Profit Factor",
    validWhen: "DYNAMIC, or when a run stopped out",
    why: "Gross profit and gross loss are both order-invariant with a fixed stake.",
  },
  {
    metric: "Win Rate",
    validWhen: "Only when a run stopped out",
    why: "Permuting trades cannot change how many of them were winners.",
  },
  {
    metric: "Total Trades",
    validWhen: "Only when a run stopped out",
    why: "The trade list is the same list, reordered — the count is fixed.",
  },
];

export const BT_SHUFFLER_DIAGNOSTIC_CODES = [
  {
    code: "MCL_CHAIN_PADDED",
    label: "MCL chain padded",
    critical: false,
    text: "The requested loss chain was longer than the available losses, so it was padded from the loss bag.",
  },
  {
    code: "MCW_BREAK_FAILED",
    label: "MCW break failures",
    critical: true,
    text: "The win streak could not be broken at the requested length — the constraint was not fully satisfied.",
  },
  {
    code: "W_BAG_EXHAUSTED",
    label: "W-bag exhausted",
    critical: true,
    text: "Ran out of winning trades while assembling the sequence; the tail was filled with losses.",
  },
  {
    code: "MCW_CEILING_BREACHED",
    label: "MCW ceiling breached",
    critical: false,
    text: "A win streak exceeded the level ceiling because no losing trade was left to break it.",
  },
];

/* ----------------------------------------------------------------- synthetic */

export const BT_SYNTHETIC_METHODS = [
  { value: "metric_generator", label: "Metric Generator (folds)" },
  { value: "gbm", label: "GBM" },
  { value: "garch", label: "GARCH" },
];

export const BT_VOLATILITY_LEVELS = [
  { value: "0_calm", label: "0 — calm" },
  { value: "1_low", label: "1 — low" },
  { value: "2_medium", label: "2 — medium" },
  { value: "3_high", label: "3 — high" },
  { value: "4_extreme", label: "4 — extreme" },
];

export const BT_VOLATILITY_DEFAULT = "2_medium";

export const BT_SYNTHETIC_N_PRESETS = [10, 100, 500, 1000, 2000, 5000];
export const BT_SYNTHETIC_N_DEFAULT = 1000;

export const BT_SYNTHETIC_SOURCES = [
  { value: "inherited", label: "From the backtest" },
  { value: "custom", label: "Custom period" },
];

export const BT_SYNTHETIC_INFO_NOTE =
  "Real historical (the actual backtest on the period) is compared against the distribution of N synthetic runs. " +
  "Every run is a new series, so all 6 core metrics are fully valid — no degeneracy as in Shuffler.";

/* ------------------------------------------------------------------ percentiles */

/** Percentile zones — §8.7. */
export const BT_PERCENTILE_ZONES = { green: [40, 60], yellow: [25, 75] };

/* ------------------------------------------------------------------ integrity */

/**
 * Comparability check (C6). `critical: true` blocks Save (⛔),
 * `critical: false` only warns (⚠).
 */
export const BT_INTEGRITY_FIELDS = [
  { key: "strategyEpoch", label: "Strategy + epoch", critical: true },
  { key: "pair", label: "Trading pair", critical: true },
  { key: "timeframe", label: "Timeframe", critical: true },
  { key: "exchange", label: "Exchange", critical: true },
  { key: "stakeMode", label: "Stake mode", critical: true },
  { key: "profitReserving", label: "Profit Reserving", critical: true },
  { key: "startingCapital", label: "Starting balance", critical: false },
];

export const BT_INTEGRITY_LEVEL = { OK: "ok", WARN: "warn", BLOCK: "block" };

/* ----------------------------------------------------------- run-params diff */

/** Criticality of every field in the "backtest vs mini" comparison — §6.1.1. */
export const BT_MINI_DIFF_FIELDS = [
  { key: "period", label: "Date range", severity: "premise" },
  { key: "strategyEpoch", label: "Strategy + epoch", severity: "critical" },
  { key: "pair", label: "Pairs", severity: "critical" },
  { key: "timeframe", label: "Timeframe", severity: "critical" },
  { key: "exchange", label: "Exchange", severity: "critical" },
  { key: "mode", label: "Mode", severity: "critical" },
  { key: "leverage", label: "Leverage", severity: "critical" },
  { key: "stakeMode", label: "Stake mode", severity: "critical" },
  { key: "profitReserving", label: "Reserve from Profit", severity: "critical" },
  {
    key: "fees",
    label: "Fees",
    severity: "conditional",
    note: "BT — from the exchange config · mini — entered manually; the gap explains part of Δ.",
  },
  { key: "startingCapital", label: "Starting Capital", severity: "conditional" },
];

/* ---------------------------------------------------------------------- copy */

export const BT_COPY = {
  epochHint:
    "One epoch is validated at a time. Switching epochs never mixes runs, analytics and archives.",
  noEpoch:
    "No favorite epoch available — Stage 4 has not promoted one. There is nothing to validate yet.",
  emptyTree:
    'No backtest runs yet. Hit "Run Backtest" to start validating this epoch.',
  childrenLocked: "Wait for the backtest to finish.",
  noThresholds:
    "There are no acceptance thresholds: the system collects data, the quant makes the call.",
  standalone:
    "Run without a mini: no comparison columns, no reproduction check.",
  customPeriodWarning:
    "A custom period excludes this run from strict comparability in analytics.",
  archiveHint:
    "Saved analytics whose branch was deleted. Read-only: the matrix was frozen at save time.",
  recoveryNote:
    "Recovery time is measured by duration, not by calendar dates — after shuffling, close dates no longer form an increasing sequence.",
};

export const BT_TOOLTIPS = {
  delta:
    "Δ = (Backtest − Mini) / |Mini| × 100%. The sign shows the direction. N/A when the mini value is ≈ 0.",
  percentile:
    "Percentile = PERCENTRANK.INC(sample, Original). 0% — no simulation was better; 100% — no simulation was worse.",
  originalPct:
    "Where the Original sits inside the simulated distribution. 0% — no permutation was better; 100% — no permutation was worse; N/A — the metric does not depend on order.",
  edited: (n) => `${n} parameter(s) differ from the mini`,
  naOrderInvariant:
    "N/A · Shuffler — this metric does not depend on the order of trades under the selected simulation mode.",
  naDivZero: "N/A — the reference value is ≈ 0, a relative change is undefined.",
  resilience:
    "Resilience score 0–100 — how well the strategy holds up across the simulated sections. ≥80 strong · 50–79 neutral · <50 fragile.",
};

/** Tooltips for Backtesting info → Performance summary rows (keyed by row.key). */
export const BT_PERFORMANCE_TOOLTIPS = {
  netPlPct: {
    formula: [
      "Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100",
      "Absolute: End Tradable − Start Tradable",
    ],
    text: "Result on the **trading balance** — the money the strategy actually traded with. The reserve is not part of it.",
  },
  netPlUsdt: {
    formula: ["Absolute: End Tradable − Start Tradable"],
    text: "The same result in quote currency. This is what the source report calls Total Profit.",
  },
  annualPl: {
    formula: ["Percentage: PnL Tradable % ÷ (backtesting_days ÷ 365)"],
    text: "Net P/L stretched to a yearly basis without compounding. For the compounded version see CAGR in the cards below.",
  },
  netPlTotal: {
    formula: [
      "Absolute: PnL Tradable + PnL Reserved",
      "Percentage: PnL Tradable % + PnL Reserved %",
    ],
    text: "Result including the profit that was moved to the reserve. In the temporal report this is PnL Total. It is a different number from Net P/L tradable — the reserve softens the loss.",
  },
  maker: {
    formula: ["Absolute: sum fee cost for all orders where fee_type = maker"],
    text: "Sum of fees on orders that went onto the order book first — limit orders and anything filled from them. Shown as N/A when the run produced no maker fills.",
  },
  taker: {
    formula: ["Absolute: sum fee cost for all orders where fee_type = taker"],
    text: "Sum of fees on orders that traded immediately against the book. A market-order strategy pays taker on every fill.",
  },
  funding: {
    formula: [
      "Absolute: sum funding fee for all trades",
      "Funding amount: Nominal value of positions × funding rate",
      "Nominal value: Mark price × size of a contract",
    ],
    text: "Periodic payments between long and short traders on perpetual contracts. Positive means the run received funding, negative means it paid.",
  },
  totalFees: {
    formula: ["Absolute: fee maker abs + fee taker abs + funding fees"],
    text: "The full cost of trading. This is the number Δ against the mini is mostly made of.",
  },
  maxDdAccount: {
    formula: [
      "Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100",
      "Absolute: Max Tradable at Peak − Min Tradable after Peak",
    ],
    text: "Deepest drop from the highest balance peak to the lowest point, measured on closed trades only. Open positions and intra-candle moves are not part of it.",
  },
  avgDd: {
    text: "Average depth of all drawdowns in the run, not just the worst one. A high average with a similar maximum means the strategy sat under water most of the time.",
  },
  maxDdRealPct: {
    formula: [
      "Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100",
      "Equity: Free tradable + Used Margin + Unrealized PnL",
    ],
    text: "Deepest drop measured on equity over time, not on closed trades. It counts unrealised P/L, candle movement and the effect of leverage — so it also captures drawdowns of positions that later recovered.",
  },
  maxDdRealUsdt: {
    formula: [
      "Absolute: Max Equity at Peak − Min Equity after Peak",
      "Equity: Free tradable + Used Margin + Unrealized PnL",
    ],
    text: "The same equity-based drawdown in quote currency.",
  },
  maxDdAbs: {
    text: "Peak-to-trough distance taken over the whole equity curve, without splitting it into separate drawdown episodes. It differs slightly from Max drawdown, real because the two use different peak definitions.",
  },
  days: {
    text: "Calendar days covered by the run — from the first to the last candle. Avg daily trades is derived from it.",
  },
  trades: {
    formula: ["Count: count(trades)"],
    text: "Every trade the strategy executed and closed within the period.",
  },
  avgDaily: {
    formula: ["Ratio: Total trades ÷ backtesting_days"],
    text: "How busy the strategy is. Useful for judging whether the sample is large enough to trust the statistics.",
  },
  winrate: {
    formula: ["Percentage: wins ÷ (wins + losses) × 100"],
    text: "Share of profitable trades, written as wins / losses. On its own it says little: a strategy can win 80% of trades and still lose money if the losers are larger.",
  },
  ccl: {
    formula: ["Percentage: canceled ÷ (canceled + not canceled) × 100"],
    text: "Share of canceled trades against the rest, written as canceled / not canceled. A trade counts as canceled when its exit reason is canceled.",
  },
  durAvg: {
    formula: ["avg(trade duration)"],
    text: "From entry fill to exit fill, averaged over all trades.",
  },
  durMin: {
    formula: ["min(trade duration)"],
    text: "Shortest trade in the run.",
  },
  durMax: {
    formula: ["max(trade duration)"],
    text: "Longest trade in the run.",
  },
  downAvg: {
    formula: ["avg(idle periods)"],
    text: "Idle time between one trade closing and the next one opening. Large downtime with many trades means the strategy fires in bursts.",
  },
  downMin: {
    formula: ["min(idle periods)"],
    text: "Shortest gap between two trades.",
  },
  downMax: {
    formula: ["max(idle periods)"],
    text: "Longest stretch with no position at all.",
  },
  sizeAvg: {
    formula: ["Notional: avg(amount × entry price)"],
    text: "Notional value of a position at entry, averaged over all trades. Notional includes leverage, so it is larger than the margin actually committed.",
  },
  sizeMin: {
    formula: ["Notional: min(amount × entry price)"],
    text: "Smallest notional the run opened.",
  },
  sizeMax: {
    formula: ["Notional: max(amount × entry price)"],
    text: "Largest notional the run opened.",
  },
  maxLossN: {
    text: "Longest unbroken run of losing trades. This is what a live account has to survive without the quant switching the strategy off.",
  },
  avgLossN: {
    text: "Typical length of a losing streak.",
  },
  maxLossAmt: {
    text: "Money lost during the worst losing streak.",
  },
  avgLossAmt: {
    text: "Money lost during a typical losing streak.",
  },
  maxWinN: {
    text: "Longest unbroken run of winning trades.",
  },
  avgWinN: {
    text: "Typical length of a winning streak.",
  },
  maxWinAmt: {
    text: "Money made during the best winning streak.",
  },
  avgWinAmt: {
    text: "Money made during a typical winning streak.",
  },
  tradable: {
    formula: ["Absolute: Total balance − Reserved amount"],
    text: "Balance the strategy is allowed to trade with at the end of the run — the reserve is excluded.",
  },
  reserved: {
    formula: ["Absolute: sum(reserved amount per trade)"],
    text: "Profit moved aside by Profit Reserving. It no longer takes part in trading.",
  },
  totalBal: {
    formula: ["Absolute: Tradable amount + Reserved amount"],
    text: "Everything the account holds at the end of the run.",
  },
  ratio: {
    formula: ["Ratio: Reserved amount ÷ Tradable amount"],
    text: "Represents the share of capital that is reserved compared to the tradable balance. Closer to 0 — most funds are available for trading. Closer to 1 — most funds are reserved and locked. = 1 — the reserve equals the tradable balance. > 1 — the reserve is larger than what is being traded.",
  },

  // --- Summary cards ---
  cagr: {
    formula: [
      "(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
    ],
    text: "Compound annual growth rate on the total balance (tradable + reserved), assuming profits are reinvested.",
  },
  sortino: {
    text: "Return per unit of downside volatility. Unlike Sharpe it does not punish upside swings.",
  },
  sharpe: {
    text: "Return per unit of total volatility.",
  },
  calmar: {
    text: "Annual return divided by the maximum drawdown. Answers “how much return per unit of pain”.",
  },
  expectancy: {
    text: "Average result of one trade in R-multiples. Negative expectancy means the strategy loses on average, no matter the win rate.",
  },
  profitFactor: {
    formula: ["Ratio: gross profit ÷ gross loss"],
    text: "Above 1 the strategy earns more than it loses. Below 1 it does the opposite.",
  },
  outcomeCounts: {
    text: "Trade counts behind the win rate.",
  },
  outcomeDays: {
    text: "Calendar days split by the result of that day. Useful for spotting a strategy that earns on a handful of days and bleeds on the rest.",
  },
  avgDurWinners: {
    text: "How long profitable trades were held.",
  },
  avgDurLosers: {
    text: "How long losing trades were held. Losers held much longer than winners is a classic sign of a missing or late stop.",
  },
  bestDay: {
    text: "Best single calendar day of the run.",
  },
  worstDay: {
    text: "Worst single calendar day of the run.",
  },
  bestTrade: {
    text: "Most profitable trade, in percent of its stake.",
  },
  worstTrade: {
    text: "Largest losing trade, in percent of its stake.",
  },
  longShortCounts: {
    text: "How the trades split by direction.",
  },
  netPlLong: {
    text: "Result produced by long trades only.",
  },
  netPlShort: {
    text: "Result produced by short trades only.",
  },
  minBalance: {
    text: "Lowest the account went during the run.",
  },
  maxBalance: {
    text: "Highest the account reached during the run.",
  },
  marketChange: {
    text: "How much the traded instrument itself moved over the period. It is the benchmark the run is compared against.",
  },
  ddHighLow: {
    text: "Balance at the start and at the bottom of the deepest drawdown.",
  },
  ddStart: {
    text: "When the deepest drawdown began.",
  },
  ddEnd: {
    text: "When the account came back to its previous peak, or the run ended.",
  },
};

/** Tooltips for Backtesting info → Temporal metrics summary (keyed by row.key). */
export const BT_TEMPORAL_TOOLTIPS = {
  relMaxDdTradable: {
    formula: [
      "Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100",
      "Absolute: Max Tradable at Peak − Min Tradable after Peak",
    ],
    text: "Shows the maximum drawdown from any local maximum (Tradable) to the minimum value (Trough) after it. Based on closed trades only. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.",
  },
  relDdTradable: {
    formula: [
      "Percentage: (Start Tradable − Min Tradable) ÷ Start Tradable × 100",
      "Absolute: Start Tradable − Min Tradable",
    ],
    text: "Measures how much the tradable balance fell from the start of the period. Absolute decline from start of the year to the lowest point. Based on closed trades only.",
  },
  relMaxDdEquity: {
    formula: [
      "Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100",
      "Absolute: Max Equity at Peak − Min Equity after Peak",
    ],
    text: "Shows the maximum drawdown from any local maximum (Equity) to the minimum value (Trough) after it. Includes open trades. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.",
  },
  relDdEquity: {
    formula: [
      "Percentage: (Start Equity − Min Equity) ÷ Start Equity × 100",
      "Absolute: Start Equity − Min Equity",
    ],
    text: "Shows how far equity fell from the starting point of the period. Absolute equity drawdown from period start. Includes open trades.",
  },
  pnlTradable: {
    formula: [
      "Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100",
      "Absolute: End Tradable − Start Tradable",
    ],
    text: "Profit and Loss for tradable balance during the period. Percentage shows the relative return on the starting tradable balance. Absolute shows the actual amount gained or lost in tradable balance.",
  },
  pnlReserved: {
    formula: [
      "Percentage: (Reserved amount ÷ Start Tradable) × 100",
      "Absolute: Reserved amount",
    ],
    text: "Profit reserved funds during the period. Percentage shows the reserved amount relative to the starting tradable balance. Absolute shows the actual reserved amount.",
  },
  pnlTotal: {
    formula: [
      "Percentage: PnL Tradable % + PnL Reserved %",
      "Absolute: PnL Tradable + PnL Reserved",
    ],
    text: "Total Profit and Loss combining tradable and reserved amounts. Percentage shows the combined relative return. Absolute shows the total actual amount gained or lost.",
  },
  totalMakerTakerFee: {
    formula: [
      "Percentage: (Total maker/taker fee ÷ start tradable) × 100",
      "Absolute: fee maker abs + fee taker abs",
    ],
    text: "fee maker abs — sum fee cost for all orders where fee_type = maker. fee taker abs — sum fee cost for all orders where fee_type = taker. Taker: when you place an order that trades immediately before going on the order book, you are a taker. This is regardless of whether you partially or fully fulfill the order. Maker: when you place an order that goes on the order book partially or fully, such as a limit order, any subsequent trades coming from that order will be maker trades.",
  },
  totalFundingFees: {
    formula: [
      "Percentage: (funding fees ÷ start tradable) × 100",
      "Absolute: sum funding fee for all trades",
      "Funding amount: Nominal value of positions × funding rate",
      "Nominal value: Mark price × size of a contract",
    ],
    text: "Funding rates are periodic payments made to either long or short traders, calculated based on the difference between the perpetual contract prices and spot prices. When the market is bullish, the funding rate is positive and tends to rise over time. In these situations, traders long on a perpetual contract will pay a funding fee to traders on the opposing side. Conversely, the funding rate will be negative when the market is bearish, where traders short on a perpetual contract will pay a funding fee to long traders.",
  },
  cagrTradable: {
    formula: [
      "(final_balance(tradable) ÷ starting_balance(tradable)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
    ],
    text: "CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with tradable amount.",
  },
  cagrTotal: {
    formula: [
      "(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
    ],
    text: "CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with total amount (total = tradable + reserved).",
  },
  startTradable: {
    text: "Represents the tradable balance value at the beginning of the selected period. Based on closed trades only. This may not always be exactly at 01/01/YYYY 00:00:00, but rather the first available timestamp within the period.",
  },
  endTradable: {
    text: "Represents the tradable balance value at the end of the selected period. Based on closed trades only. This may not always be exactly at 12/31/YYYY 00:00:00, but rather the last available timestamp within the period.",
  },
  minTradable: {
    text: "Lowest tradable balance reached within the selected period. Based on closed trades only.",
  },
  maxTradable: {
    text: "Highest tradable balance reached within the selected period. Based on closed trades only.",
  },
  startEquity: {
    formula: ["Equity = Free tradable + Used Margin + Unrealized PnL"],
    text: "Represents the equity value at the beginning of the selected period. Includes open trades. This may not always be exactly at 01/01/YYYY 00:00:00, but rather the first available timestamp within the period.",
  },
  endEquity: {
    formula: ["Equity = Free tradable + Used Margin + Unrealized PnL"],
    text: "Represents the equity value at the end of the selected period. Includes open trades. This may not always be exactly at 12/31/YYYY 00:00:00, but rather the last available timestamp within the period.",
  },
  minEquity: {
    formula: ["Equity = Free tradable + Used Margin + Unrealized PnL"],
    text: "Lowest equity value reached within the selected period. Includes open trades.",
  },
  maxEquity: {
    formula: ["Equity = Free tradable + Used Margin + Unrealized PnL"],
    text: "Highest equity value reached within the selected period. Includes open trades.",
  },
  maxTradableAtPeak: {
    text: "Max Tradable at Peak — the local peak value of Tradable in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125.",
  },
  minTradableAfterPeak: {
    text: "Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Tradable. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1.",
  },
  maxEquityAtPeak: {
    text: "Max Equity at Peak — the local peak value of Equity in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125.",
  },
  minEquityAfterPeak: {
    text: "Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Equity. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2.",
  },
};

/** Tooltips for Backtesting info → Fees tab column headers. */
export const BT_FEES_TOOLTIPS = {
  openTaker: {
    text: "Taker fee paid when the position was opened.",
  },
  openMaker: {
    text: "Maker fee paid when the position was opened.",
  },
  closeTaker: {
    text: "Taker fee paid when the position was closed.",
  },
  closeMaker: {
    text: "Maker fee paid when the position was closed.",
  },
};

/** Tooltips for Backtesting info → Trades tab column headers. */
export const BT_TRADES_TOOLTIPS = {
  stakeAmount: {
    text: "Position size at entry, with leverage in brackets.",
  },
  stopLoss: {
    text: "Stop price in force for this trade at the moment it was closed.",
  },
  liqPrice: {
    text: "Price at which the position would be liquidated by the exchange.",
  },
  netPlPct: {
    formula: ["Percentage: net result of the row ÷ stake used × 100"],
    text: "Result of this row — an enter tag, an exit reason or a single trade — in percent of the stake it used. This is not an account-level figure; for that see Net P/L tradable, %.",
  },
  netPlUsdt: {
    formula: ["Absolute: sum of net result across the trades of the row"],
    text: "The same row-level result in quote currency, after fees and funding.",
  },
  reserved: {
    text: "Profit moved to the reserve by this particular trade.",
  },
};
