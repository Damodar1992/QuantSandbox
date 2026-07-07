/**
 * Mini Backtest Analyzer — constants, defaults, labels, units.
 */

export const MINI_BACKTEST_DEFAULTS = {
  initialBalance: 10000,
  stakeMode: "fixed", // 'fixed' | 'relative'
  fixedStakeAmount: 100,
  relativeStakeAmount: 10, // %
  reservedPct: 0, // % of winning cycle net → reserve pot
  orderType: "taker", // 'taker' | 'maker'
  feeTaker: 0.1, // %
  feeMaker: 0.05, // %
  slippage: 0.05, // % (taker only)
  marketType: "spot", // 'spot' | 'futures'
  leverage: 5,
  maintMargin: 0.5, // %
  fundRate: 0.01, // % per 8h
  stopoutMode: "pct", // 'amount' | 'pct'
  stopout: 20, // $ floor or % of start (0 = off)
  cycleCount: 50,
};

export const MINI_BACKTEST_LABELS = {
  initialBalance: "Initial Balance",
  stakeMode: "Stake Mode",
  fixedStakeAmount: "Fixed Stake",
  relativeStakeAmount: "Relative Stake",
  reservedPct: "Reserve from Profit",
  orderType: "Order Type",
  feeTaker: "Taker Fee",
  feeMaker: "Maker Fee",
  slippage: "Slippage",
  marketType: "Market Type",
  leverage: "Leverage",
  maintMargin: "Maint. Margin",
  fundRate: "Funding Rate",
  stopoutMode: "Stopout Mode",
  stopout: "Stopout Floor",
  cycleCount: "Cycle Count (max)",
  // legacy keys (read-only display)
  reservedAmount: "Reserved Amount (legacy)",
  fees: "Fees (legacy)",
};

export const MINI_BACKTEST_UNITS = {
  initialBalance: "USDT",
  fixedStakeAmount: "USDT",
  relativeStakeAmount: "%",
  reservedPct: "%",
  feeTaker: "%",
  feeMaker: "%",
  slippage: "%",
  leverage: "×",
  maintMargin: "%",
  fundRate: "% / 8h",
  stopout: "USDT or %",
  cycleCount: "",
};

/** Editable parameter keys in modal iteration order */
export const MINI_BACKTEST_PARAM_KEYS = [
  "initialBalance",
  "fixedStakeAmount",
  "relativeStakeAmount",
  "reservedPct",
  "feeTaker",
  "feeMaker",
  "slippage",
  "leverage",
  "maintMargin",
  "fundRate",
  "stopout",
  "cycleCount",
];

export const MINI_BACKTEST_STAKE_MODES = [
  { value: "fixed", label: "Fixed" },
  { value: "relative", label: "Relative" },
];

export const MINI_BACKTEST_ORDER_TYPES = [
  { value: "taker", label: "Taker" },
  { value: "maker", label: "Maker" },
];

export const MINI_BACKTEST_MARKET_TYPES = [
  { value: "spot", label: "Spot" },
  { value: "futures", label: "Futures" },
];

export const MINI_BACKTEST_STOPOUT_MODES = [
  { value: "amount", label: "Amount" },
  { value: "pct", label: "% of Start" },
];

export const MINI_BACKTEST_DASHBOARD_TABS = [
  { id: "backtest", label: "Overview" },
  { id: "compare", label: "Before / After" },
  { id: "cycles", label: "Cycle Reports" },
  { id: "formula", label: "Formula Reference" },
];

/** Sidebar / run lifecycle statuses for Mini Backtest list. */
export const MINI_BACKTEST_RUN_STATUSES = {
  IN_PROGRESS: "In Progress",
  FINISHED: "Finished",
  FAIL: "Fail",
};

export function normalizeMiniBacktestRunStatus(status) {
  if (!status) return MINI_BACKTEST_RUN_STATUSES.FINISHED;
  if (status === "Finish" || status === "Done" || status === "Completed") {
    return MINI_BACKTEST_RUN_STATUSES.FINISHED;
  }
  if (status === "Failed") return MINI_BACKTEST_RUN_STATUSES.FAIL;
  return status;
}
